import {APIRequestContext} from "@playwright/test";
import {ApiResponse} from "@src/types";

export class ApiClient {
    constructor(private apiClient: APIRequestContext) {}

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        const response = await this.apiClient.get(endpoint);
        if (!response.ok()) {
            throw new Error(`GET ${endpoint} failed with status ${response.status()}`);
        }

        return {
            data: await response.json() as T,
            status: response.status()
        }
    }

    async post<T>(endpoint: string, body?: object): Promise<ApiResponse<T>> {
        const response = await this.apiClient.post(endpoint, {data: body});

        if (!response.ok()) {
            throw new Error(`POST ${endpoint} failed with status ${response.status()}`);
        }

        return {
            data: await response.json() as T,
            status: response.status()
        }
    }
}