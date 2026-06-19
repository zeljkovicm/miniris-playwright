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
exports.OrderDetailPanel = void 0;
class OrderDetailPanel {
    constructor(page) {
        this.page = page;
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
    isReady() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.detailCard.waitFor({ state: "visible" });
        });
    }
    getDetailId() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.detailId.innerText();
        });
    }
    getDetailPatient() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.detailPatient.innerText();
        });
    }
    getDetailStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.detailStatus.innerText();
        });
    }
    schedule(scheduledAt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.scheduledAtInput.fill(scheduledAt);
            yield this.scheduleButton.click();
        });
    }
    perform() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.performButton.click();
        });
    }
    createReport(radiologist, findings) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.radiologistInput.fill(radiologist);
            yield this.findingsInput.fill(findings);
            yield this.createReportButton.click();
        });
    }
    signReport() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.signButton.click();
        });
    }
    isDone() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.detailDone.isVisible();
        });
    }
    hasError() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.detailError.isVisible();
        });
    }
}
exports.OrderDetailPanel = OrderDetailPanel;
