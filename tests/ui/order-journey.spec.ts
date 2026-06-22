import {test, expect} from "@src/fixtures";
import {createCtHeadOrder} from "@src/data";
import {ApiResponse, CreateOrder, Order} from "@src/types";

test.describe("UI E2E", () => {

    test.describe("Order journey", () => {
        test("Should create an order through UI @ui", async ({mainPage}) => {
            const orderData: CreateOrder = createCtHeadOrder();
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.newOrderForm.createOrder(orderData);
            await mainPage.worklistTable.containsPatient(orderData.patient_name);
        })

        test("Should complete full workflow to signed report @ui @e2e @smoke", async ({ordersClient, mainPage}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
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

    test.describe("Scheduling", () => {
        test("Should schedule an order via UI @ui", async ({ordersClient, mainPage}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.worklistTable.openOrder(order.data.id);
            await mainPage.orderDetailPanel.isReady();

            const futureDate: string = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16);
            await mainPage.orderDetailPanel.schedule(futureDate);
            await mainPage.worklistTable.waitForOrderStatus(order.data.id, "SCHEDULED");
        })

        test("Should not allow scheduling in the past via UI @ui", async ({ordersClient, mainPage}) => {
            test.fixme(
                true,
                "Question: Specification does not define whether a past scheduled_at should be rejected, user can select it trough UI."
            )
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.worklistTable.openOrder(order.data.id);
            await mainPage.orderDetailPanel.isReady();

            await mainPage.orderDetailPanel.schedule("2020-01-01T10:00");
            await mainPage.orderDetailPanel.expectError();
        })
    })

    test.describe("Filtering and search", () => {
        test("Should filter worklist by status @ui", async ({ordersClient, mainPage}) => {
            const orderData: CreateOrder = createCtHeadOrder();
            await ordersClient.createOrder(orderData);
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.worklistTable.containsPatient(orderData.patient_name);
            await mainPage.worklistTable.filterByStatus("REGISTERED");
            await mainPage.worklistTable.containsPatient(orderData.patient_name);
        })

        test("Should search worklist by patient name @ui", async ({ordersClient, mainPage}) => {
            const orderData:CreateOrder = createCtHeadOrder();
            await ordersClient.createOrder(orderData);
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.worklistTable.containsPatient(orderData.patient_name);
            await mainPage.worklistTable.search(orderData.patient_name);
            await mainPage.worklistTable.containsPatient(orderData.patient_name);
        })

        test("Worklist should be empty when searching for a non-existing patient @ui", async ({mainPage}) => {
            await mainPage.goto();
            await mainPage.isReady();
            await mainPage.worklistTable.search("jibberish-nonexistent-id");
            expect(await mainPage.worklistTable.isWorklistEmpty()).toBe(true);
        })
    })
})
