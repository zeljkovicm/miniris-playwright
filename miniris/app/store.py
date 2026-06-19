"""
In-memory store for MiniRIS.

Intentional behaviour (documented in README): the worklist (GET /api/orders) is a
read projection that lags writes by PROJECTION_DELAY_SECONDS. A single order fetched
by id (GET /api/orders/{id}) is always authoritative and updates immediately. This
models the read-plane / write-plane split of the real system and is a deliberate part
of the exercise, not a bug.
"""
import time
import threading
from datetime import datetime, timezone

PROJECTION_DELAY_SECONDS = 1.5
_PAST = 0.0  # seed rows are immediately visible in the worklist


def _now() -> float:
    return time.time()


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


class Store:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    # ---- lifecycle -------------------------------------------------------
    def reset(self) -> None:
        with self._lock:
            self._orders: dict[str, dict] = {}
            self._reports: dict[str, dict] = {}
            self._order_seq = 1000
            self._report_seq = 2000
            self._seed()

    def _seed(self) -> None:
        seed = [
            ("Anna Berger", "PAT-0001", "CT", "Head", "URGENT", "REGISTERED"),
            ("Boris Novak", "PAT-0002", "MR", "Knee", "ROUTINE", "SCHEDULED"),
            ("Carla Weiss", "PAT-0003", "XR", "Chest", "ROUTINE", "PERFORMED"),
            ("Dario Lukic", "PAT-0004", "US", "Abdomen", "STAT", "REPORTED"),
            ("Eva Hofer", "PAT-0005", "MG", "Breast", "ROUTINE", "SIGNED"),
            ("Felix Maier", "PAT-0006", "CT", "Thorax", "URGENT", "REGISTERED"),
            ("Greta Schmidt", "PAT-0007", "MR", "Spine", "ROUTINE", "SCHEDULED"),
            ("Hugo Pavic", "PAT-0008", "XR", "Wrist", "ROUTINE", "PERFORMED"),
        ]
        for name, pid, modality, body_part, priority, status in seed:
            oid = self._next_order_id()
            order = {
                "id": oid,
                "patient_name": name,
                "patient_id": pid,
                "modality": modality,
                "body_part": body_part,
                "priority": priority,
                "status": status,
                "prev_status": status,
                "status_changed_at": _PAST,
                "created_at": _iso(datetime.now(timezone.utc)),
                "scheduled_at": None,
                "report_id": None,
            }
            if status in ("REPORTED", "SIGNED"):
                rid = self._next_report_id()
                report = {
                    "id": rid,
                    "order_id": oid,
                    "body": f"Findings for {body_part.lower()} study. No acute abnormality.",
                    "radiologist": "Dr. Seed",
                    "status": "SIGNED" if status == "SIGNED" else "DRAFT",
                    "created_at": _iso(datetime.now(timezone.utc)),
                    "signed_at": _iso(datetime.now(timezone.utc)) if status == "SIGNED" else None,
                }
                self._reports[rid] = report
                order["report_id"] = rid
            if status in ("SCHEDULED", "PERFORMED", "REPORTED", "SIGNED"):
                order["scheduled_at"] = _iso(datetime.now(timezone.utc))
            self._orders[oid] = order

    # ---- id helpers ------------------------------------------------------
    def _next_order_id(self) -> str:
        self._order_seq += 1
        return f"ORD-{self._order_seq}"

    def _next_report_id(self) -> str:
        self._report_seq += 1
        return f"REP-{self._report_seq}"

    # ---- projection ------------------------------------------------------
    def _projected_status(self, order: dict) -> str:
        if _now() - order["status_changed_at"] >= PROJECTION_DELAY_SECONDS:
            return order["status"]
        return order["prev_status"]

    def _public(self, order: dict, projected: bool) -> dict:
        status = self._projected_status(order) if projected else order["status"]
        return {
            "id": order["id"],
            "patient_name": order["patient_name"],
            "patient_id": order["patient_id"],
            "modality": order["modality"],
            "body_part": order["body_part"],
            "priority": order["priority"],
            "status": status,
            "created_at": order["created_at"],
            "scheduled_at": order["scheduled_at"],
            "report_id": order["report_id"],
        }

    def _transition(self, order: dict, new_status: str) -> None:
        order["prev_status"] = order["status"]
        order["status"] = new_status
        order["status_changed_at"] = _now()

    # ---- queries ---------------------------------------------------------
    def worklist(self, status: str | None, modality: str | None, q: str | None) -> list[dict]:
        with self._lock:
            rows = [self._public(o, projected=True) for o in self._orders.values()]
        if status:
            rows = [r for r in rows if r["status"] == status.upper()]
        if modality:
            rows = [r for r in rows if r["modality"] == modality.upper()]
        if q:
            needle = q.lower()
            rows = [
                r for r in rows
                if needle in r["patient_name"].lower() or needle in r["patient_id"].lower()
            ]
        rows.sort(key=lambda r: r["id"])
        return rows

    def get_order(self, order_id: str) -> dict | None:
        with self._lock:
            order = self._orders.get(order_id)
            return self._public(order, projected=False) if order else None

    def get_report(self, report_id: str) -> dict | None:
        with self._lock:
            return dict(self._reports[report_id]) if report_id in self._reports else None

    # ---- commands --------------------------------------------------------
    def create_order(self, data: dict) -> dict:
        with self._lock:
            oid = self._next_order_id()
            order = {
                "id": oid,
                "patient_name": data["patient_name"],
                "patient_id": data["patient_id"],
                "modality": data["modality"],
                "body_part": data["body_part"],
                "priority": data["priority"],
                "status": "REGISTERED",
                "prev_status": "REGISTERED",
                "status_changed_at": _now(),
                "created_at": _iso(datetime.now(timezone.utc)),
                "scheduled_at": None,
                "report_id": None,
            }
            self._orders[oid] = order
            return self._public(order, projected=False)

    def schedule(self, order_id: str, scheduled_at: datetime) -> dict:
        with self._lock:
            order = self._require(order_id)
            if order["status"] != "REGISTERED":
                raise ValueError(f"Cannot schedule an order in status {order['status']}")
            order["scheduled_at"] = _iso(scheduled_at)
            self._transition(order, "SCHEDULED")
            return self._public(order, projected=False)

    def perform(self, order_id: str) -> dict:
        with self._lock:
            order = self._require(order_id)
            if order["status"] != "SCHEDULED":
                raise ValueError(f"Cannot perform an order in status {order['status']}")
            self._transition(order, "PERFORMED")
            return self._public(order, projected=False)

    def create_report(self, data: dict) -> dict:
        with self._lock:
            order = self._require(data["order_id"])
            if order["status"] != "PERFORMED":
                raise ValueError(f"Cannot report an order in status {order['status']}")
            rid = self._next_report_id()
            report = {
                "id": rid,
                "order_id": order["id"],
                "body": data["body"],
                "radiologist": data["radiologist"],
                "status": "DRAFT",
                "created_at": _iso(datetime.now(timezone.utc)),
                "signed_at": None,
            }
            self._reports[rid] = report
            order["report_id"] = rid
            self._transition(order, "REPORTED")
            return dict(report)

    def sign_report(self, report_id: str) -> dict:
        with self._lock:
            if report_id not in self._reports:
                raise KeyError(report_id)
            report = self._reports[report_id]
            if report["status"] != "DRAFT":
                raise ValueError(f"Report is already {report['status']}")
            order = self._require(report["order_id"])
            report["status"] = "SIGNED"
            report["signed_at"] = _iso(datetime.now(timezone.utc))
            self._transition(order, "SIGNED")
            return dict(report)

    def _require(self, order_id: str) -> dict:
        if order_id not in self._orders:
            raise KeyError(order_id)
        return self._orders[order_id]


store = Store()
