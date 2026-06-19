import {test, expect} from "@src/fixtures";
import {createCtHeadOrder} from "@src/data";
import {ApiResponse, Order} from "@src/types";

test.describe("Worklist E2E", () => {
    test("Should create an order through UI @e2e", async ({mainPage}) => {
        const orderData = createCtHeadOrder();
        await mainPage.goto();
        await mainPage.isReady();
        await mainPage.newOrderForm.createOrder(orderData);
        await mainPage.worklistTable.waitForPatient(orderData.patient_name);
    })

    test("Should filter worklist by status @e2e", async ({ordersClient, mainPage}) => {
        const orderData = createCtHeadOrder();
        await ordersClient.createOrder(orderData);
        await mainPage.goto();
        await mainPage.isReady();
        await mainPage.worklistTable.waitForPatient(orderData.patient_name);
        await mainPage.worklistTable.filterByStatus("REGISTERED");
        await mainPage.worklistTable.containsPatient(orderData.patient_name);
    })

    test("Should filter worklist by modality @e2e", async ({ordersClient, mainPage}) => {
        const orderData = createCtHeadOrder();
        await ordersClient.createOrder(orderData);
        await mainPage.goto();
        await mainPage.isReady();
        await mainPage.worklistTable.waitForPatient(orderData.patient_name);
        await mainPage.worklistTable.filterByModality("CT");
        await mainPage.worklistTable.containsPatient(orderData.patient_name);
    })

    test("Should search worklist by patient name @e2e", async ({ordersClient, mainPage}) => {
        const orderData = createCtHeadOrder();
        await ordersClient.createOrder(orderData);
        await mainPage.goto();
        await mainPage.isReady();
        await mainPage.worklistTable.waitForPatient(orderData.patient_name);
        await mainPage.worklistTable.search(orderData.patient_name);
        await mainPage.worklistTable.containsPatient(orderData.patient_name);
    })

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
        await mainPage.worklistTable.waitForOrderStatus(order.data.id, "REPORTED");
        await mainPage.orderDetailPanel.signReport();
        expect(await mainPage.orderDetailPanel.isDone()).toBe(true);
    })
})