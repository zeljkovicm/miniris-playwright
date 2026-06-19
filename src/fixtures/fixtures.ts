import {test as base} from "@playwright/test";
import {AdminClient, OrdersClient, ReportsClient} from "@src/api";
import {MainPage} from "@src/pages";

type Fixtures = {
    ordersClient: OrdersClient;
    reportsClient: ReportsClient;
    adminClient: AdminClient;
    mainPage: MainPage;
}

export const test = base.extend<Fixtures>({
    ordersClient: async ({request}, use) => {
        await use(new OrdersClient(request));
    },
    reportsClient: async ({request}, use) => {
        await use(new ReportsClient(request));
    },
    adminClient: async ({request}, use) => {
        const client = new AdminClient(request);
        await client.reset();
        await use(client);
    },
    mainPage: async ({page}, use) => {
        const mainPage = new MainPage(page);
        await use(mainPage);
    }
})

export {expect} from "@playwright/test";