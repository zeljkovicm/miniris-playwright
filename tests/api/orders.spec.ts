import {test, expect} from "@src/fixtures";

import {createCtHeadOrder} from "@src/data";
import {ApiResponse, Order, Orders} from "@src/types";

test.describe("Orders API", () => {
    test("Should return a list of orders", async ({ordersClient}) => {
        const orders: ApiResponse<Orders> = await ordersClient.getOrders();

        expect(orders.status).toBe(200);
        expect(Array.isArray(orders.data.items)).toBe(true);
    })

    test("Should return 404 for non-existing order", async ({ordersClient}) => {
        await expect(ordersClient.getOrder("wrong id")).rejects.toThrow("404")
    })

    test("Should create an order", async ({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());

        expect(order.status).toBe(201);
        expect(order.data.id).toBeDefined();
        expect(order.data.status).toBe("REGISTERED");
        expect(order.data.patient_name).toBe("Test Patient 01");
        expect(order.data.modality).toBe("CT");
    })

    test("Should return a single order", async ({ordersClient}) => {
        const {data: created} = await ordersClient.createOrder(createCtHeadOrder());
        const singleOrder: ApiResponse<Order> = await ordersClient.getOrder(created.id);

        expect(singleOrder.status).toBe(200);
        expect(singleOrder.data.id).toBe(created.id);
    })

    test("Should schedule an order", async({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt = new Date().toISOString();

        const scheduledOrder = await ordersClient.scheduleOrder(order.data.id, scheduledAt);

        expect(scheduledOrder.status).toBe(200);
        expect(scheduledOrder.data.status).toBe("SCHEDULED");
        expect(scheduledOrder.data.scheduled_at).toBeDefined();
    })

    test("Should perform an order", async({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt = new Date().toISOString();

        await ordersClient.scheduleOrder(order.data.id, scheduledAt);
        const performedOrder = await ordersClient.performOrder(order.data.id);

        expect(performedOrder.status).toBe(200);
        expect(performedOrder.data.status).toBe("PERFORMED");
    })

    test("Should return 404 when performing non-existent order", async({ordersClient}) => {
        await expect(ordersClient.performOrder("wrong id")).rejects.toThrow("404")
    })

    test("Should return 409 when scheduling an already scheduled order", async({ordersClient}) => {
        const {data: order} = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt: string = new Date().toISOString();

        await ordersClient.scheduleOrder(order.id, scheduledAt);

        await expect(ordersClient.scheduleOrder(order.id, scheduledAt)).rejects.toThrow("409");
    })
})