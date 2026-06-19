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
exports.WorklistTable = void 0;
class WorklistTable {
    constructor(page) {
        this.page = page;
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
    isReady() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.worklistLoading.waitFor({ state: "hidden" });
        });
    }
    openOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.page.getByTestId(`open-${id}`).click();
        });
    }
    getOrderStatus(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.page.getByTestId(`status-${id}`).innerText();
        });
    }
    waitForOrderStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.page.getByTestId(`status-${id}`).getByText(status).waitFor({ state: "visible" });
        });
    }
}
exports.WorklistTable = WorklistTable;
