import {test, expect} from "@src/fixtures";
import {createCtHeadOrder, createReportData} from "@src/data";
import {ApiResponse, Order, Report} from "@src/types";

test.describe("Reports API", () => {
    test("Should create a report @api @smoke", async ({ordersClient, reportsClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);

        const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.data.id));

        expect(report.data.id).toBeDefined();
        expect(report.data.order_id).toBe(order.data.id);
        expect(report.data.status).toBe("DRAFT");
    })

    test("Should get 409 when creating report for non-performed orders @api", async ({ordersClient, reportsClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        await expect(reportsClient.createReport(createReportData(order.data.id))).rejects.toThrow("409");
    })

    test("Should get a report @api", async ({ ordersClient, reportsClient }) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);
        const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.data.id));

        const fetchedReport: ApiResponse<Report> = await reportsClient.getReport(report.data.id);

        expect(fetchedReport.data.id).toBe(report.data.id);
    })

    test("Should get 404 for non existing report @api", async({reportsClient}) => {
        await expect(reportsClient.getReport("wrong id")).rejects.toThrow("404");
    })

    test("Should sign a report @api @smoke", async({ordersClient, reportsClient}) => {
        const order: ApiResponse<Order> = await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);
        const report: ApiResponse<Report> = await reportsClient.createReport(createReportData(order.data.id));

        const signedReport: ApiResponse<Report>  = await reportsClient.signReport(report.data.id);

        expect(signedReport.data.status).toBe("SIGNED");
        expect(signedReport.data.signed_at).toBeDefined();

    })

    test("Should return 409 when signing already signed report @api", async ({ordersClient, reportsClient}) => {
        const order = await ordersClient.createOrder(createCtHeadOrder());
        await ordersClient.scheduleOrder(order.data.id, new Date().toISOString());
        await ordersClient.performOrder(order.data.id);
        const report = await reportsClient.createReport(createReportData(order.data.id));
        await reportsClient.signReport(report.data.id);
        await expect(reportsClient.signReport(report.data.id)).rejects.toThrow("409");
    })

    test("Should return 422 for invalid report body @api", async ({reportsClient}) => {
        await expect(reportsClient.createReport({} as any)).rejects.toThrow("422");
    })
})