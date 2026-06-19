import {test, expect} from "@src/fixtures";

import {createCtHeadOrder} from "@src/data";
import {ApiResponse, Modality, Order, Orders, OrderStatus} from "@src/types";

test.describe("Orders API", () => {
    test("Should return a list of orders @api", async ({ordersClient}) => {
        const orders: ApiResponse<Orders> = await ordersClient.getOrders();

        expect(orders.status).toBe(200);
        expect(Array.isArray(orders.data.items)).toBe(true);
    })

    test("Should return 404 for non-existing order @api", async ({ordersClient}) => {
        await expect(ordersClient.getOrder("wrong id")).rejects.toThrow("404")
    })

    test("Should create an order @api @smoke", async ({ordersClient}) => {
        const orderData = createCtHeadOrder();
        const order = await ordersClient.createOrder(orderData);

        expect(order.status).toBe(201);
        expect(order.data.id).toBeDefined();
        expect(order.data.status).toBe("REGISTERED");
        expect(order.data.patient_name).toBe(orderData.patient_name);
        expect(order.data.modality).toBe("CT");
    })

    test("Should return 422 for invalid order body @api", async ({ordersClient}) => {
        await expect(ordersClient.createOrder({} as any)).rejects.toThrow("422");
    })

    test("Should return a single order @api", async ({ordersClient}) => {
        const {data: created} = await ordersClient.createOrder(createCtHeadOrder());
        const singleOrder: ApiResponse<Order> = await ordersClient.getOrder(created.id);

        expect(singleOrder.status).toBe(200);
        expect(singleOrder.data.id).toBe(created.id);
    })

    test("Should schedule an order @api @smoke", async({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt = new Date().toISOString();

        const scheduledOrder = await ordersClient.scheduleOrder(order.data.id, scheduledAt);

        expect(scheduledOrder.status).toBe(200);
        expect(scheduledOrder.data.status).toBe("SCHEDULED");
        expect(scheduledOrder.data.scheduled_at).toBeDefined();
    })

    test("Should perform an order @api", async({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt = new Date().toISOString();

        await ordersClient.scheduleOrder(order.data.id, scheduledAt);
        const performedOrder = await ordersClient.performOrder(order.data.id);

        expect(performedOrder.status).toBe(200);
        expect(performedOrder.data.status).toBe("PERFORMED");
    })

    test("Should return 404 when performing non-existent order @api", async({ordersClient}) => {
        await expect(ordersClient.performOrder("wrong id")).rejects.toThrow("404")
    })

    test("Should return 409 when performing already performed order @api", async ({ordersClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);
        await expect(ordersClient.performOrder(order.data.id)).rejects.toThrow("409");
    })

    test("Should return 409 when scheduling an already scheduled order @api", async({ordersClient}) => {
        const {data: order} = await ordersClient.createOrder(createCtHeadOrder());
        const scheduledAt: string = new Date().toISOString();

        await ordersClient.scheduleOrder(order.id, scheduledAt);

        await expect(ordersClient.scheduleOrder(order.id, scheduledAt)).rejects.toThrow("409");
    })

    test("Should filter orders by status @api", async ({ordersClient}) => {
        const testStatus: OrderStatus = "REGISTERED"
        const orders: ApiResponse<Orders> = await ordersClient.getOrders(testStatus);

        expect(orders.status).toBe(200);
        expect(orders.data.items.every(order => order.status === testStatus)).toBe(true);
    })

    test("Should filter orders by modality @api", async ({ordersClient}) => {
        const testModality: Modality = "CT"
        const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, testModality);

        expect(orders.status).toBe(200);
        expect(orders.data.items.every(order => order.modality === testModality)).toBe(true);
    })

    test("Should search orders py patient name @api", async ({ordersClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, undefined, order.data.patient_name);

        expect(orders.status).toBe(200);
        expect(orders.data.items.some(o => o.patient_name === order.data.patient_name)).toBe(true);
    })

    test("Should search orders py patient id @api", async ({ordersClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, undefined, order.data.patient_id);

        expect(orders.status).toBe(200);
        expect(orders.data.items.some(o => o.id === order.data.id)).toBe(true);
    })
})