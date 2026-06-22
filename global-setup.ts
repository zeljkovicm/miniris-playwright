import { request } from "@playwright/test";

async function globalSetup() {
    const context = await request.newContext({ baseURL: process.env.BASE_URL });
    await context.post("/api/admin/reset");
    await context.dispose();
}

export default globalSetup;
