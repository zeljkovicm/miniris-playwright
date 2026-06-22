import {ApiClient} from "@src/api/ApiClient";
import {APIRequestContext} from "@playwright/test";
import {ApiResponse, CreateReport, Report} from "@src/types";

export class ReportsClient extends ApiClient{
    constructor(request: APIRequestContext) {
        super(request);
    }

    async getReport(id: string): Promise<ApiResponse<Report>> {
        return await this.get<Report>(`/api/reports/${id}`);
    }

    async createReport(data: CreateReport): Promise<ApiResponse<Report>> {
        return await this.post<Report>("/api/reports", data, 201);
    }

    async signReport(id: string): Promise<ApiResponse<Report>> {
        return await this.post<Report>(`/api/reports/${id}/sign`);
    }
}
