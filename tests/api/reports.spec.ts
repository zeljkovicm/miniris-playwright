import {test, expect} from "@src/fixtures";
import {createCtHeadOrder, createReportData} from "@src/data";
import {ApiResponse, Order, Report} from "@src/types";
import {createPerformedOrder} from "@src/helpers";

test.describe("Reports API", () => {
    test.describe("Lifecycle", () => {
        test("Should create and fetch report @api", async ({ordersClient, reportsClient}) => {
            const order: Order = await createPerformedOrder(ordersClient);

            const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.id));
            expect(report.data.id).toBeDefined();
            expect(report.data.order_id).toBe(order.id);
            expect(report.data.status).toBe("DRAFT");

            const fetched: ApiResponse<Report> = await reportsClient.getReport(report.data.id);
            expect(fetched.data.id).toBe(report.data.id);
        })

        test("Should sign a report @api", async ({ordersClient, reportsClient}) => {
            const order: Order = await createPerformedOrder(ordersClient);

            const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.id));

            const signedReport: ApiResponse<Report> = await reportsClient.signReport(report.data.id);
            expect(signedReport.data.status).toBe("SIGNED");
            expect(signedReport.data.signed_at).toBeDefined();
        })
    })

    test.describe("Validation and state transitions", () => {
        test("Should return 409 when creating report for non-performed order @api", async ({ordersClient, reportsClient}) => {
            const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
            await expect(reportsClient.createReport(createReportData(order.data.id))).rejects.toThrow("409");
        })

        test("Should return 404 for non-existing report @api", async ({reportsClient}) => {
            await expect(reportsClient.getReport("wrong id")).rejects.toThrow("404");
        })

        test("Should return 409 when signing already signed report @api", async ({ordersClient, reportsClient}) => {
            const order: Order = await createPerformedOrder(ordersClient);
            const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.id));
            await reportsClient.signReport(report.data.id);
            await expect(reportsClient.signReport(report.data.id)).rejects.toThrow("409");
        })

        test("Should return 404 when signing non-existing report @api", async ({reportsClient}) => {
            await expect(reportsClient.signReport("wrong id")).rejects.toThrow("404");
        })

        test("Should return 422 for invalid report body @api", async ({reportsClient}) => {
            await expect(reportsClient.createReport({} as any)).rejects.toThrow("422");
        })
    })
})