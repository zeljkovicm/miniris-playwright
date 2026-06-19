import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .models import CreateOrderRequest, ScheduleRequest, CreateReportRequest
from .store import store, PROJECTION_DELAY_SECONDS

app = FastAPI(title="MiniRIS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api = FastAPI(title="MiniRIS API", version="1.0.0")


@api.get("/health")
def health():
    return {"status": "ok", "projection_delay_seconds": PROJECTION_DELAY_SECONDS}


@api.get("/orders")
def list_orders(status: str | None = None, modality: str | None = None, q: str | None = None):
    return {"items": store.worklist(status, modality, q)}


@api.post("/orders", status_code=201)
def create_order(req: CreateOrderRequest):
    return store.create_order({
        "patient_name": req.patient_name,
        "patient_id": req.patient_id,
        "modality": req.modality.value,
        "body_part": req.body_part,
        "priority": req.priority.value,
    })


@api.get("/orders/{order_id}")
def get_order(order_id: str):
    order = store.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@api.post("/orders/{order_id}/schedule")
def schedule_order(order_id: str, req: ScheduleRequest):
    try:
        return store.schedule(order_id, req.scheduled_at)
    except KeyError:
        raise HTTPException(status_code=404, detail="Order not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@api.post("/orders/{order_id}/perform")
def perform_order(order_id: str):
    try:
        return store.perform(order_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Order not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@api.post("/reports", status_code=201)
def create_report(req: CreateReportRequest):
    try:
        return store.create_report({
            "order_id": req.order_id,
            "body": req.body,
            "radiologist": req.radiologist,
        })
    except KeyError:
        raise HTTPException(status_code=404, detail="Order not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@api.get("/reports/{report_id}")
def get_report(report_id: str):
    report = store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@api.post("/reports/{report_id}/sign")
def sign_report(report_id: str):
    try:
        return store.sign_report(report_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Report not found")
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@api.post("/admin/reset")
def reset():
    store.reset()
    return {"status": "reset"}


app.mount("/api", api)

_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
