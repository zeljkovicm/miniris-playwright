import {OrdersClient} from "@src/api";
import {ApiResponse, Order} from "@src/types";
import {createCtHeadOrder} from "@src/data";

export async function createPerformedOrder(ordersClient: OrdersClient): Promise<Order> {
    const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
    await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
    await ordersClient.performOrder(order.data.id);
    return order.data
}
