import {test, expect} from "@src/fixtures";

import {createCtHeadOrder} from "@src/data";
import {ApiResponse, CreateOrder, Modality, Order, Orders, OrderStatus} from "@src/types";
import {createPerformedOrder} from "@src/helpers";

test.describe("Orders API", () => {

    test.describe("Lifecycle", () => {
        test("Should return a list of orders @api", async ({ordersClient}) => {
            const orders: ApiResponse<Orders> = await ordersClient.getOrders();
            expect(Array.isArray(orders.data.items)).toBe(true);
        })

        test("Should create and fetch an order @api", async ({ordersClient}) => {
            const orderData: CreateOrder = createCtHeadOrder();
            const order: ApiResponse<Order> = await ordersClient.createOrder(orderData);

            expect(order.data.id).toBeDefined();
            expect(order.data.status).toBe("REGISTERED");
            expect(order.data.patient_name).toBe(orderData.patient_name);
            expect(order.data.modality).toBe(orderData.modality);

            const fetched: ApiResponse<Order> = await ordersClient.getOrder(order.data.id);
            expect(fetched.data.id).toBe(order.data.id);
            expect(fetched.data.patient_name).toBe(order.data.patient_name);
        })

        test("Should schedule an order @api", async({ordersClient}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            const scheduledAt: string  = new Date().toISOString();

            const scheduledOrder: ApiResponse<Order> = await ordersClient.scheduleOrder(order.data.id, scheduledAt);

            expect(scheduledOrder.data.status).toBe("SCHEDULED");
            expect(scheduledOrder.data.scheduled_at).toBeDefined();
            expect(new Date(scheduledOrder.data.scheduled_at!).getTime()).toBe(new Date(scheduledAt).getTime());
        })
    })

    test.describe("Validation and state transitions", () => {
        test("Should return 404 for non-existing order @api", async ({ordersClient}) => {
            await expect(ordersClient.getOrder("wrong id")).rejects.toThrow("404")
        })

        test("Should return 422 for invalid order body @api", async ({ordersClient}) => {
            await expect(ordersClient.createOrder({} as any)).rejects.toThrow("422");
        })

        test("Should not allow scheduling in the past @api", async({ordersClient}) => {
            test.fixme(
                true,
                "Question: Specification does not define whether a past scheduled_at should be rejected, API currently accepts it."
            )
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            const pastDate: string = new Date(Date.now() - 86400000).toISOString();
            await expect(ordersClient.scheduleOrder(order.data.id, pastDate)).rejects.toThrow("422");
        })

        test("Should return 404 when performing non-existent order @api", async({ordersClient}) => {
            await expect(ordersClient.performOrder("wrong id")).rejects.toThrow("404")
        })

        test("Should return 409 when performing already performed order @api", async ({ordersClient}) => {
            const order: Order = await createPerformedOrder(ordersClient);
            await expect(ordersClient.performOrder(order.id)).rejects.toThrow("409");
        })

        test("Should return 409 when performing non-scheduled order @api", async ({ordersClient}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            await expect(ordersClient.performOrder(order.data.id)).rejects.toThrow("409");
        })

        test("Should return 409 when scheduling an already scheduled order @api", async({ordersClient}) => {
            const {data: order} = await ordersClient.createOrder(createCtHeadOrder());
            const scheduledAt: string = new Date().toISOString();

            await ordersClient.scheduleOrder(order.id, scheduledAt);

            await expect(ordersClient.scheduleOrder(order.id, scheduledAt)).rejects.toThrow("409");
        })
    })

    test.describe("Filtering and search", () => {
        test("Should filter orders by status @api", async ({ordersClient}) => {
            const testStatus: OrderStatus = "REGISTERED"

            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            expect(order.data.status).toBe(testStatus);

            const orders: ApiResponse<Orders> = await ordersClient.getOrders(testStatus);
            expect(orders.data.items.some(o => o.status === testStatus)).toBe(true);
            expect(orders.data.items.every(o => o.status === testStatus)).toBe(true);
        })

        test("Should filter orders by modality @api", async ({ordersClient}) => {
            const testModality: Modality = "CT"

            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            expect(order.data.modality).toBe(testModality);

            const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, testModality);
            expect(orders.data.items.some(o => o.modality === testModality)).toBe(true);
            expect(orders.data.items.every(o => o.modality === testModality)).toBe(true);
        })

        test("Should search orders by patient name @api", async ({ordersClient}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());

            const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, undefined, order.data.patient_name);

            expect(orders.data.items.some(o => o.patient_name === order.data.patient_name)).toBe(true);
            expect(orders.data.items.every(o => o.patient_name === order.data.patient_name)).toBe(true);
        })

        test("Should search orders by patient id @api", async ({ordersClient}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());

            const orders: ApiResponse<Orders> = await ordersClient.getOrders(undefined, undefined, order.data.patient_id);

            expect(orders.data.items.some(o => o.patient_id === order.data.patient_id)).toBe(true);
            expect(orders.data.items.every(o => o.patient_id === order.data.patient_id)).toBe(true);
        })

        test("Should filter orders by status and modality @api", async ({ordersClient}) => {
            const testStatus: OrderStatus = "REGISTERED";
            const testModality: Modality = "CT";

            await ordersClient.createOrder(createCtHeadOrder());

            const orders: ApiResponse<Orders> = await ordersClient.getOrders(testStatus, testModality);
            expect(orders.data.items.some(o => o.status === testStatus && o.modality === testModality)).toBe(true);
            expect(orders.data.items.every(o => o.status === testStatus && o.modality === testModality)).toBe(true);
        })
    })
})