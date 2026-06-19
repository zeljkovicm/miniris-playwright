import {ApiClient} from "@src/api/ApiClient";
import {ApiResponse, CreateOrder, Modality, Order, Orders, OrderStatus} from "@src/types";
import {APIRequestContext} from "@playwright/test";

export class OrdersClient extends ApiClient{
    constructor(request: APIRequestContext) {
        super(request);
    }

    async getOrders(status?: OrderStatus, modality?: Modality, q?: string): Promise<ApiResponse<Orders>> {
        const query = new URLSearchParams();
        if (status) query.set("status", status);
        if (modality) query.set("modality", modality);
        if (q) query.set("q", q);

        const endpoint = `/api/orders${query.toString() ? "?" + query.toString() : ""}`;
        return this.get<Orders>(endpoint);
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