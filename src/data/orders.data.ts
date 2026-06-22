import {CreateOrder} from "@src/types";

export const createCtHeadOrder = (): CreateOrder => ({
    patient_name: `Test Patient CT ${Date.now()}`,
    patient_id: `PAT-CT-${Date.now()}`,
    modality: "CT",
    body_part: "Head",
    priority: "URGENT"
});

export const createMrKneeOrder = (): CreateOrder => ({
    patient_name: `Test Patient MR ${Date.now()}`,
    patient_id: `PAT-MR-${Date.now()}`,
    modality: "MR",
    body_part: "Knee",
    priority: "ROUTINE"
});
