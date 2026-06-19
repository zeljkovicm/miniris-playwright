"use strict";

const API = (window.MINIRIS_API || "/api").replace(/\/$/, "");

let currentOrderId = null;
let currentReportId = null;

function $(id) {
  return document.getElementById(id);
}

async function api(path, options) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch (_) {
    payload = null;
  }
  if (!res.ok) {
    const message = payload && payload.detail ? payload.detail : "Request failed (" + res.status + ")";
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return payload;
}

function statusBadge(status) {
  return '<span class="badge badge-' + status.toLowerCase() + '">' + status + "</span>";
}

async function loadWorklist() {
  const status = $("filter-status").value;
  const modality = $("filter-modality").value;
  const q = $("search").value.trim();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (modality) params.set("modality", modality);
  if (q) params.set("q", q);

  $("worklist-loading").hidden = false;
  $("worklist-empty").hidden = true;
  try {
    const data = await api("/orders?" + params.toString());
    const items = data.items || [];
    const body = $("worklist-body");
    body.innerHTML = "";
    for (const o of items) {
      const tr = document.createElement("tr");
      tr.setAttribute("data-testid", "order-row-" + o.id);
      tr.innerHTML =
        "<td>" + o.id + "</td>" +
        "<td>" + o.patient_name + "</td>" +
        "<td>" + o.patient_id + "</td>" +
        "<td>" + o.modality + "</td>" +
        "<td>" + o.body_part + "</td>" +
        "<td>" + o.priority + "</td>" +
        '<td data-testid="status-' + o.id + '">' + statusBadge(o.status) + "</td>" +
        '<td><button data-testid="open-' + o.id + '">Open</button></td>';
      tr.querySelector("button").addEventListener("click", () => openOrder(o.id));
      body.appendChild(tr);
    }
    $("worklist-empty").hidden = items.length !== 0;
  } finally {
    $("worklist-loading").hidden = true;
  }
}

function showActionsForStatus(status) {
  $("action-schedule").hidden = status !== "REGISTERED";
  $("action-perform").hidden = status !== "SCHEDULED";
  $("action-report").hidden = status !== "PERFORMED";
  $("action-sign").hidden = status !== "REPORTED";
  $("action-done").hidden = status !== "SIGNED";
}

async function openOrder(orderId) {
  currentOrderId = orderId;
  currentReportId = null;
  $("detail-error").hidden = true;
  const order = await api("/orders/" + orderId);
  $("detail-card").hidden = false;
  $("detail-id").textContent = order.id;
  $("detail-patient").textContent = order.patient_name + " (" + order.patient_id + ")";
  $("detail-status").textContent = order.status;
  currentReportId = order.report_id;
  showActionsForStatus(order.status);
}

async function refreshDetail() {
  if (currentOrderId) {
    await openOrder(currentOrderId);
  }
}

function showDetailError(err) {
  const el = $("detail-error");
  el.textContent = err.message;
  el.hidden = false;
}

async function createOrder() {
  const payload = {
    patient_name: $("patient_name").value.trim(),
    patient_id: $("patient_id").value.trim(),
    modality: $("modality").value,
    body_part: $("body_part").value.trim(),
    priority: $("priority").value,
  };
  await api("/orders", { method: "POST", body: JSON.stringify(payload) });
  $("patient_name").value = "";
  $("patient_id").value = "";
  $("body_part").value = "";
  await loadWorklist();
}

async function doSchedule() {
  try {
    const raw = $("scheduled_at").value;
    const scheduledAt = raw ? new Date(raw).toISOString() : new Date().toISOString();
    await api("/orders/" + currentOrderId + "/schedule", {
      method: "POST",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    });
    await refreshDetail();
    await loadWorklist();
  } catch (err) {
    showDetailError(err);
  }
}

async function doPerform() {
  try {
    await api("/orders/" + currentOrderId + "/perform", { method: "POST" });
    await refreshDetail();
    await loadWorklist();
  } catch (err) {
    showDetailError(err);
  }
}

async function doReport() {
  try {
    const payload = {
      order_id: currentOrderId,
      radiologist: $("radiologist").value.trim() || "Dr. Anon",
      body: $("report_body").value.trim() || "No findings entered.",
    };
    const report = await api("/reports", { method: "POST", body: JSON.stringify(payload) });
    currentReportId = report.id;
    await refreshDetail();
    await loadWorklist();
  } catch (err) {
    showDetailError(err);
  }
}

async function doSign() {
  try {
    if (!currentReportId) {
      const order = await api("/orders/" + currentOrderId);
      currentReportId = order.report_id;
    }
    await api("/reports/" + currentReportId + "/sign", { method: "POST" });
    await refreshDetail();
    await loadWorklist();
  } catch (err) {
    showDetailError(err);
  }
}

function wire() {
  $("create-order").addEventListener("click", createOrder);
  $("apply-filters").addEventListener("click", loadWorklist);
  $("refresh").addEventListener("click", loadWorklist);
  $("do-schedule").addEventListener("click", doSchedule);
  $("do-perform").addEventListener("click", doPerform);
  $("do-report").addEventListener("click", doReport);
  $("do-sign").addEventListener("click", doSign);
  loadWorklist();
}

document.addEventListener("DOMContentLoaded", wire);
