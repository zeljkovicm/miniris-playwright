"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReportData = void 0;
const createReportData = (orderId) => ({
    order_id: orderId,
    body: "Test findings",
    radiologist: "Dr Test"
});
exports.createReportData = createReportData;
