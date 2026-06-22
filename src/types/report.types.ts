export interface Report {
    id: string;
    order_id: string;
    body: string;
    radiologist: string;
    status: ReportStatus;
    signed_at: string | null;
}

export interface CreateReport {
    order_id: string;
    body: string;
    radiologist: string;
}

export type ReportStatus = "DRAFT" | "SIGNED"
