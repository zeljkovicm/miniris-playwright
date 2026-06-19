import {Locator, Page, expect} from "@playwright/test";
import {OrderStatus} from "@src/types";
import {Component} from "@src/pages/components/Component";

export class WorklistTable implements Component{

    private readonly statusFilter: Locator;
    private readonly modalityFilter: Locator;
    private readonly searchInput: Locator;
    private readonly applyButton: Locator;
    private readonly refreshButton: Locator;
    private readonly worklistLoading: Locator;
    private readonly worklistEmpty: Locator;
    private readonly worklistTable: Locator;
    private readonly worklistTableBody: Locator;

    constructor(private readonly page: Page) {

        this.statusFilter = this.page.getByTestId("filter-status");
        this.modalityFilter = this.page.getByTestId("filter-modality");
        this.searchInput = this.page.getByTestId("search");
        this.applyButton = this.page.getByTestId("apply-filters");
        this.refreshButton = this.page.getByTestId("refresh");

        this.worklistLoading = this.page.getByTestId("worklist-loading");
        this.worklistEmpty = this.page.getByTestId("worklist-empty");
        this.worklistTable = this.page.getByTestId("worklist");
        this.worklistTableBody = this.page.getByTestId("worklist-body");
    }

    async isReady(): Promise<void> {
        await this.worklistLoading.waitFor({state: "hidden"});
    }

    async openOrder(id: string): Promise<void> {
        await this.page.getByTestId(`open-${id}`).click();
    }

    async getOrderStatus(id: string): Promise<string> {
        return await this.page.getByTestId(`status-${id}`).innerText();
    }

    async waitForOrderStatus(id: string, status: OrderStatus): Promise<void> {
        await expect(async () => {
            await this.refreshButton.click();
            await this.worklistLoading.waitFor({ state: 'hidden' });
            await this.page.getByTestId(`status-${id}`).getByText(status).waitFor({ state: 'visible', timeout: 3000 });
        }).toPass({ timeout: 30_000, intervals: [2000] });
    }

}