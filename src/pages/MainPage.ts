import {BasePage} from "@src/pages/BasePage";
import {Page} from "@playwright/test";
import {NewOrderForm, OrderDetailPanel, WorklistTable} from "@src/pages/components";

export class MainPage extends BasePage{
    readonly newOrderForm: NewOrderForm
    readonly worklistTable: WorklistTable
    readonly orderDetailPanel: OrderDetailPanel;

    constructor(page: Page) {
        super(page);
        this.newOrderForm = new NewOrderForm(page);
        this.worklistTable = new WorklistTable(page);
        this.orderDetailPanel = new OrderDetailPanel(page);
    }
    async goto(): Promise<void> {
        await super.goto("/");
    }
    async isReady(): Promise<void> {
        await this.newOrderForm.isReady();
        await this.worklistTable.isReady();
    }
}