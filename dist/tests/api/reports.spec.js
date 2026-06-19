"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("@src/fixtures");
const data_1 = require("@src/data");
fixtures_1.test.describe("Reports API", () => {
    (0, fixtures_1.test)("Should create a report @api @smoke", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, reportsClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        yield ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        yield ordersClient.performOrder(order.data.id);
        const report = yield reportsClient.createReport((0, data_1.createReportData)(order.data.id));
        (0, fixtures_1.expect)(report.status).toBe(201);
        (0, fixtures_1.expect)(report.data.id).toBeDefined();
        (0, fixtures_1.expect)(report.data.order_id).toBe(order.data.id);
        (0, fixtures_1.expect)(report.data.status).toBe("DRAFT");
    }));
    (0, fixtures_1.test)("Should get 409 when createing report for non-performed orders @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, reportsClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        yield (0, fixtures_1.expect)(reportsClient.createReport((0, data_1.createReportData)(order.data.id))).rejects.toThrow("409");
    }));
    (0, fixtures_1.test)("Should get a report @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, reportsClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        yield ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        yield ordersClient.performOrder(order.data.id);
        const report = yield reportsClient.createReport((0, data_1.createReportData)(order.data.id));
        const fetchedReport = yield reportsClient.getReport(report.data.id);
        (0, fixtures_1.expect)(fetchedReport.status).toBe(200);
        (0, fixtures_1.expect)(fetchedReport.data.id).toBe(report.data.id);
    }));
    (0, fixtures_1.test)("Should get 404 for non existing report @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, reportsClient }) {
        yield (0, fixtures_1.expect)(reportsClient.getReport("wrong id")).rejects.toThrow("404");
    }));
    (0, fixtures_1.test)("Should sign a report @api @smoke", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, reportsClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        yield ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        yield ordersClient.performOrder(order.data.id);
        const report = yield reportsClient.createReport((0, data_1.createReportData)(order.data.id));
        const signedReport = yield reportsClient.signReport(report.data.id);
        (0, fixtures_1.expect)(signedReport.status).toBe(200);
        (0, fixtures_1.expect)(signedReport.data.status).toBe("SIGNED");
        (0, fixtures_1.expect)(signedReport.data.signed_at).toBeDefined();
    }));
});
