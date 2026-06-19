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
fixtures_1.test.describe("Worklist E2E", () => {
    (0, fixtures_1.test)("Should complete full workflow to signed report @e2e", (_a) => __awaiter(void 0, [_a], void 0, function* ({ ordersClient, mainPage }) {
        const order = yield ordersClient.createOrder((0, data_1.createCtHeadOrder)());
        yield ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        yield ordersClient.performOrder(order.data.id);
        yield mainPage.goto();
        yield mainPage.worklistTable.waitForOrderStatus(order.data.id, "PERFORMED");
        yield mainPage.worklistTable.openOrder(order.data.id);
        yield mainPage.orderDetailPanel.isReady();
        yield mainPage.orderDetailPanel.createReport("Dr Test", "No findings");
        yield mainPage.orderDetailPanel.isReady();
        yield mainPage.orderDetailPanel.signReport();
        (0, fixtures_1.expect)(yield mainPage.orderDetailPanel.isDone()).toBe(true);
    }));
});
