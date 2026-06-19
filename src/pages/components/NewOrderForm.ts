import {Locator, Page} from "@playwright/test";
import {CreateOrder} from "@src/types";
import {Component} from "@src/pages/components/Component";

export class NewOrderForm implements Component{

    private readonly patientNameInput: Locator;
    private readonly patientIdInput: Locator;
    private readonly modalityInput: Locator;
    private readonly bodyPartInput: Locator;
    private readonly priorityInput: Locator;
    private readonly createOrderButton: Locator;

    constructor(private readonly page: Page) {
        this.patientNameInput = this.page.getByTestId("patient-name");
        this.patientIdInput = this.page.getByTestId("patient-id");
        this.modalityInput = this.page.getByTestId("modality");
        this.bodyPartInput = this.page.getByTestId("body-part");
        this.priorityInput = this.page.getByTestId("priority");
        this.createOrderButton = this.page.getByTestId("create-order");
    }

    async isReady(): Promise<void> {
        await this.createOrderButton.waitFor({state: "visible"});
    }

    async createOrder(data: CreateOrder): Promise<void> {
        await this.patientNameInput.fill(data.patient_name);
        await this.patientIdInput.fill(data.patient_id);
        await this.modalityInput.selectOption(data.modality);
        await this.bodyPartInput.fill(data.body_part);
        await this.priorityInput.selectOption(data.priority);
        await this.createOrderButton.click()
    }
}