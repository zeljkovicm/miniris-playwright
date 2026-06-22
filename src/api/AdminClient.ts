import {ApiClient} from "@src/api/ApiClient";
import {APIRequestContext} from "@playwright/test";

export class AdminClient extends ApiClient{
    constructor(request: APIRequestContext) {
        super(request);
    }

    async reset(): Promise<void> {
        await this.post("/api/admin/reset");
    }
}
