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
exports.OrdersClient = void 0;
const ApiClient_1 = require("@src/api/ApiClient");
class OrdersClient extends ApiClient_1.ApiClient {
    constructor(request) {
        super(request);
    }
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get("/api/orders");
        });
    }
    getOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get(`/api/orders/${id}`);
        });
    }
    createOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post("/api/orders", data);
        });
    }
    scheduleOrder(id, scheduledAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(`/api/orders/${id}/schedule`, { scheduled_at: scheduledAt });
        });
    }
    performOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post(`/api/orders/${id}/perform`);
        });
    }
}
exports.OrdersClient = OrdersClient;
