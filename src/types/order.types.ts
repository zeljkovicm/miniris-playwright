export interface Order {
    id: string;
    patient_name: string;
    patient_id: string;
    modality: Modality
    body_part: string;
    status: OrderStatus;
    priority: Priority;
    scheduled_at: string | null;
    report_id: string | null;
}

export interface Orders {
    items: Order[];
}

export interface CreateOrder {
    patient_name: string;
    patient_id: string;
    modality: Modality;
    body_part: string;
    priority: Priority;
}

export type Modality = "CT" | "MR" | "XR" | "US" | "MG";
export type Priority = "ROUTINE" | "URGENT" | "STAT";
export type OrderStatus = "REGISTERED" | "SCHEDULED"| "PERFORMED" | "REPORTED" | "SIGNED";