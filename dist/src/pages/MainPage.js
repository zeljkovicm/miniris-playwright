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
exports.MainPage = void 0;
const BasePage_1 = require("@src/pages/BasePage");
const components_1 = require("@src/pages/components");
class MainPage extends BasePage_1.BasePage {
    constructor(page) {
        super(page);
        this.newOrderForm = new components_1.NewOrderForm(page);
        this.worklistTable = new components_1.WorklistTable(page);
        this.orderDetailPanel = new components_1.OrderDetailPanel(page);
    }
    goto() {
        const _super = Object.create(null, {
            goto: { get: () => super.goto }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.goto.call(this, "/");
        });
    }
    isReady() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.newOrderForm.isReady();
            yield this.worklistTable.isReady();
        });
    }
}
exports.MainPage = MainPage;
