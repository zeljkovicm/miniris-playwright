"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMrKneeOrder = exports.createCtHeadOrder = void 0;
const createCtHeadOrder = () => ({
    patient_name: "Test Patient 01",
    patient_id: "PAT-TEST-001",
    modality: "CT",
    body_part: "Head",
    priority: "URGENT"
});
exports.createCtHeadOrder = createCtHeadOrder;
const createMrKneeOrder = () => ({
    patient_name: "Test Patient 02",
    patient_id: "PAT-TEST-002",
    modality: "MR",
    body_part: "Knee",
    priority: "ROUTINE"
});
exports.createMrKneeOrder = createMrKneeOrder;
