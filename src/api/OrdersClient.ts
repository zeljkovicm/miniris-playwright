import {ApiClient} from "@src/api/ApiClient";
import {ApiResponse, CreateOrder, Order, Orders} from "@src/types";
import {APIRequestContext, APIResponse} from "@playwright/test";

export class OrdersClient extends ApiClient{
    constructor(request: APIRequestContext) {
        super(request);
    }

    async getOrders(): Promise<ApiResponse<Orders>> {
        return this.get<Orders>("/api/orders");
    }

    async getOrder(id: string): Promise<ApiResponse<Order>> {
        return this.get<Order>(`/api/orders/${id}`);
    }

    async createOrder(data: CreateOrder): Promise<ApiResponse<Order>> {
        return this.post<Order>("/api/orders", data);
    }

    async scheduleOrder(id: string, scheduledAt: string): Promise<ApiResponse<Order>> {
        return this.post<Order>(`/api/orders/${id}/schedule`, {scheduled_at: scheduledAt});
    }

    async performOrder(id: string): Promise<ApiResponse<Order>> {
        return this.post<Order>(`/api/orders/${id}/perform`);
    }
}