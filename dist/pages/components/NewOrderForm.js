"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewOrderForm = void 0;
class NewOrderForm {
    constructor(page) {
        this.page = page;
        this.patientNameInput = this.page.getByTestId("patient-name");
        this.patientIdInput = this.page.getByTestId("patient-id");
        this.modalityInput = this.page.getByTestId("modality");
        this.bodyPartInput = this.page.getByTestId("body-part");
        this.priorityInput = this.page.getByTestId("priority");
        this.createOrderButton = this.page.getByTestId("create-order");
    }
    isReady() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createOrderButton.waitFor({ state: "visible" });
        });
    }
    createOrder(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.patientNameInput.fill(data.patient_name);
            yield this.patientIdInput.fill(data.patient_id);
            yield this.modalityInput.selectOption(data.modality);
            yield this.bodyPartInput.fill(data.body_part);
            yield this.priorityInput.selectOption(data.priority);
            yield this.createOrderButton.click();
        });
    }
}
exports.NewOrderForm = NewOrderForm;
