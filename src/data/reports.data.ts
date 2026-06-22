import {CreateReport} from "@src/types";

export const createReportData = (orderId: string): CreateReport => ({
    order_id: orderId,
    body: "Test findings",
    radiologist: "Dr Test"
})
