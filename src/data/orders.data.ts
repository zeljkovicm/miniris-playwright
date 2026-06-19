import {CreateOrder} from "@src/types";

export const createCtHeadOrder = (): CreateOrder => ({
    patient_name: "Test Patient 01",
    patient_id: "PAT-TEST-001",
    modality: "CT",
    body_part: "Head",
    priority: "URGENT"
});

export const createMrKneeOrder = (): CreateOrder => ({
    patient_name: "Test Patient 02",
    patient_id: "PAT-TEST-002",
    modality: "MR",
    body_part: "Knee",
    priority: "ROUTINE"
});