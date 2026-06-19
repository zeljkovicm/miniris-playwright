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
exports.expect = exports.test = void 0;
const test_1 = require("@playwright/test");
const api_1 = require("@src/api");
const pages_1 = require("@src/pages");
exports.test = test_1.test.extend({
    ordersClient: (_a, use_1) => __awaiter(void 0, [_a, use_1], void 0, function* ({ request }, use) {
        yield use(new api_1.OrdersClient(request));
    }),
    reportsClient: (_a, use_1) => __awaiter(void 0, [_a, use_1], void 0, function* ({ request }, use) {
        yield use(new api_1.ReportsClient(request));
    }),
    adminClient: (_a, use_1) => __awaiter(void 0, [_a, use_1], void 0, function* ({ request }, use) {
        const client = new api_1.AdminClient(request);
        yield client.reset();
        yield use(client);
    }),
    mainPage: (_a, use_1) => __awaiter(void 0, [_a, use_1], void 0, function* ({ page }, use) {
        const mainPage = new pages_1.MainPage(page);
        yield use(mainPage);
    })
});
var test_2 = require("@playwright/test");
Object.defineProperty(exports, "expect", { enumerable: true, get: function () { return test_2.expect; } });
