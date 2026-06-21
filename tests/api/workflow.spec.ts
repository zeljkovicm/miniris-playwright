import {test, expect} from "@src/fixtures";
import {ApiResponse, Order, Report} from "@src/types";
import {createCtHeadOrder, createReportData} from "@src/data";

test.describe("Full API workflow", () => {
    test("Should complete full workflow from REGISTERED to SIGNED @api @smoke", async ({ordersClient, reportsClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        expect(order.data.status).toBe("REGISTERED");

        const scheduleOrder: ApiResponse<Order> = await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        expect(scheduleOrder.data.status).toBe("SCHEDULED");

        const performed: ApiResponse<Order> = await ordersClient.performOrder(scheduleOrder.data.id);
        expect(performed.data.status).toBe("PERFORMED");

        const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.data.id));
        expect(report.data.status).toBe("DRAFT");

        const reportedOrder: ApiResponse<Order> = await ordersClient.getOrder(order.data.id);
        expect(reportedOrder.data.status).toBe("REPORTED");

        const signed: ApiResponse<Report> = await reportsClient.signReport(report.data.id);
        expect(signed.data.status).toBe("SIGNED");

        const finalOrder: ApiResponse<Order> = await ordersClient.getOrder(order.data.id);
        expect(finalOrder.data.status).toBe("SIGNED");
    })
})