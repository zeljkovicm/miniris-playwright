import {test, expect} from "@src/fixtures";
import {createCtHeadOrder} from "@src/data";
import {ApiResponse, Order} from "@src/types";

test.describe("Worklist E2E", () => {
    test("Should complete full workflow to signed report @e2e", async ({ordersClient, mainPage}) => {
        const order: ApiResponse<Order> =  await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);
        await mainPage.goto();
        await mainPage.worklistTable.waitForOrderStatus(order.data.id, "PERFORMED");
        await mainPage.worklistTable.openOrder(order.data.id);
        await mainPage.orderDetailPanel.isReady();
        await mainPage.orderDetailPanel.createReport("Dr Test", "No findings");
        await mainPage.orderDetailPanel.isReady();
        await mainPage.orderDetailPanel.signReport();
        expect(await mainPage.orderDetailPanel.isDone()).toBe(true);
    })
})