import {Page, Locator} from "@playwright/test";
import {Component} from "@src/pages/components/Component";

export class OrderDetailPanel implements Component {

    private readonly detailCard: Locator;
    private readonly detailId: Locator;
    private readonly detailPatient: Locator;
    private readonly detailStatus: Locator;
    private readonly scheduledAtInput: Locator;
    private readonly scheduleButton: Locator;
    private readonly performButton: Locator;
    private readonly radiologistInput: Locator;
    private readonly findingsInput: Locator;
    private readonly createReportButton: Locator;
    private readonly signButton: Locator;
    private readonly detailDone: Locator;
    private readonly detailError: Locator;

    constructor(private readonly page: Page) {
        this.detailCard = this.page.getByTestId("detail-card");
        this.detailId = this.page.getByTestId("detail-id");
        this.detailPatient = this.page.getByTestId("detail-patient");
        this.detailStatus = this.page.getByTestId("detail-status");
        this.scheduledAtInput = this.page.getByTestId("scheduled-at");
        this.scheduleButton = this.page.getByTestId("do-schedule");
        this.performButton = this.page.getByTestId("do-perform");
        this.radiologistInput = this.page.getByTestId("radiologist");
        this.findingsInput = this.page.getByTestId("report-body");
        this.createReportButton = this.page.getByTestId("do-report");
        this.signButton = this.page.getByTestId("do-sign");
        this.detailDone = this.page.getByTestId("detail-done");
        this.detailError = this.page.getByTestId("detail-error");
    }

    async isReady(): Promise<void> {
        await this.detailCard.waitFor({state: "visible"});
    }

    async getDetailId(): Promise<string> {
        return await this.detailId.innerText();
    }

    async getDetailPatient(): Promise<string> {
        return await this.detailPatient.innerText();
    }

    async getDetailStatus(): Promise<string> {
        return await this.detailStatus.innerText();
    }

    async schedule(scheduledAt: string): Promise<void> {
        await this.scheduledAtInput.fill(scheduledAt);
        await this.scheduleButton.click();
    }

    async perform(): Promise<void> {
        await this.performButton.click();
    }

    async createReport(radiologist: string, findings: string): Promise<void> {
        await this.radiologistInput.fill(radiologist);
        await this.findingsInput.fill(findings);
        await this.createReportButton.click();
    }

    async signReport(): Promise<void> {
        await this.signButton.click();
    }

    async isDone(): Promise<boolean> {
        return await this.detailDone.isVisible();
    }

    async hasError(): Promise<boolean> {
        return await this.detailError.isVisible();
    }

}