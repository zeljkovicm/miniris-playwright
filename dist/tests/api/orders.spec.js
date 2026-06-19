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
fixtures_1.test.describe("Orders API", () => {
    (0, fixtures_1.test)("Should return a list of orders @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const orders = yield ordersClient.getOrders();
        (0, fixtures_1.expect)(orders.status).toBe(200);
        (0, fixtures_1.expect)(Array.isArray(orders.data.items)).toBe(true);
    }));
    (0, fixtures_1.test)("Should return 404 for non-existing order @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        yield (0, fixtures_1.expect)(ordersClient.getOrder("wrong id")).rejects.toThrow("404");
    }));
    (0, fixtures_1.test)("Should create an order @api @smoke", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        (0, fixtures_1.expect)(order.status).toBe(201);
        (0, fixtures_1.expect)(order.data.id).toBeDefined();
        (0, fixtures_1.expect)(order.data.status).toBe("REGISTERED");
        (0, fixtures_1.expect)(order.data.patient_name).toBe("Test Patient 01");
        (0, fixtures_1.expect)(order.data.modality).toBe("CT");
    }));
    (0, fixtures_1.test)("Should return a single order @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const { data: created } = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        const singleOrder = yield ordersClient.getOrder(created.id);
        (0, fixtures_1.expect)(singleOrder.status).toBe(200);
        (0, fixtures_1.expect)(singleOrder.data.id).toBe(created.id);
    }));
    (0, fixtures_1.test)("Should schedule an order @api @smoke", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        const scheduledAt = new Date().toISOString();
        const scheduledOrder = yield ordersClient.scheduleOrder(order.data.id, scheduledAt);
        (0, fixtures_1.expect)(scheduledOrder.status).toBe(200);
        (0, fixtures_1.expect)(scheduledOrder.data.status).toBe("SCHEDULED");
        (0, fixtures_1.expect)(scheduledOrder.data.scheduled_at).toBeDefined();
    }));
    (0, fixtures_1.test)("Should perform an order @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        const scheduledAt = new Date().toISOString();
        yield ordersClient.scheduleOrder(order.data.id, scheduledAt);
        const performedOrder = yield ordersClient.performOrder(order.data.id);
        (0, fixtures_1.expect)(performedOrder.status).toBe(200);
        (0, fixtures_1.expect)(performedOrder.data.status).toBe("PERFORMED");
    }));
    (0, fixtures_1.test)("Should return 404 when performing non-existent order @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        yield (0, fixtures_1.expect)(ordersClient.performOrder("wrong id")).rejects.toThrow("404");
    }));
    (0, fixtures_1.test)("Should return 409 when scheduling an already scheduled order @api", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient }) {
        const { data: order } = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        const scheduledAt = new Date().toISOString();
        yield ordersClient.scheduleOrder(order.id, scheduledAt);
        yield (0, fixtures_1.expect)(ordersClient.scheduleOrder(order.id, scheduledAt)).rejects.toThrow("409");
    }));
});
