import {APIRequestContext, APIResponse} from "@playwright/test";
import {ApiResponse} from "@src/types";

export class ApiClient {
    constructor(private apiClient: APIRequestContext) {}

    async get<T>(endpoint: string, expectedStatus: number = 200): Promise<ApiResponse<T>> {
        const response: APIResponse = await this.apiClient.get(endpoint);

        if (response.status() !== expectedStatus) {
            throw new Error(`GET ${endpoint} expected ${expectedStatus} status code, but got ${response.status()} status code`);
        }

        return {
            data: await response.json() as T,
            status: response.status()
        }
    }

    async post<T>(endpoint: string, body?: object, expectedStatus: number = 200): Promise<ApiResponse<T>> {
        const response: APIResponse = await this.apiClient.post(endpoint, {data: body});

        if (response.status() !== expectedStatus) {
            throw new Error(`POST ${endpoint} expected ${expectedStatus} status code, but got ${response.status()} status code`);
        }

        return {
            data: await response.json() as T,
            status: response.status()
        }
    }
}