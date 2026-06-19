import {ApiClient} from "@src/api/ApiClient";
import {APIRequestContext} from "@playwright/test";
import {ApiResponse, CreateReport, Report} from "@src/types";

export class ReportsClient extends ApiClient{
    constructor(request: APIRequestContext) {
        super(request);
    }

    async getReport(id: string): Promise<ApiResponse<Report>> {
        return this.get<Report>(`/api/reports/${id}`);
    }

    async createReport(data: CreateReport): Promise<ApiResponse<Report>> {
        return this.post<Report>("/api/reports", data);
    }

    async signReport(id: string): Promise<ApiResponse<Report>> {
        return this.post<Report>(`/api/reports/${id}/sign`);
    }
}