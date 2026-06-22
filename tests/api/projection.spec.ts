import {test, expect} from "@src/fixtures";
import {createPerformedOrder} from "@src/helpers";
import {ApiResponse, Order, Orders} from "@src/types";

test.describe("Worklist projection (eventual consistency)", () => {
    test("Worklist projection lags behind authoritative read @api", async ({ordersClient}) => {
        const order: Order = await createPerformedOrder(ordersClient);
        expect((await ordersClient.getOrder(order.id)).data.status).toBe("PERFORMED");

        await expect.poll(async () => {
            const orders: ApiResponse<Orders> = await ordersClient.getOrders();
            return orders.data.items.find(o => o.id === order.id)?.status;
        }, { timeout: 5_000, intervals: [200] }).toBe("PERFORMED");
    })
})
