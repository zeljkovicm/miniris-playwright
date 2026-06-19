from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Modality(str, Enum):
    CT = "CT"
    MR = "MR"
    XR = "XR"
    US = "US"
    MG = "MG"


class Priority(str, Enum):
    ROUTINE = "ROUTINE"
    URGENT = "URGENT"
    STAT = "STAT"


class OrderStatus(str, Enum):
    REGISTERED = "REGISTERED"
    SCHEDULED = "SCHEDULED"
    PERFORMED = "PERFORMED"
    REPORTED = "REPORTED"
    SIGNED = "SIGNED"


class ReportStatus(str, Enum):
    DRAFT = "DRAFT"
    SIGNED = "SIGNED"


class CreateOrderRequest(BaseModel):
    patient_name: str = Field(min_length=1)
    patient_id: str = Field(min_length=1)
    modality: Modality
    body_part: str = Field(min_length=1)
    priority: Priority = Priority.ROUTINE


class ScheduleRequest(BaseModel):
    scheduled_at: datetime


class CreateReportRequest(BaseModel):
    order_id: str = Field(min_length=1)
    body: str = Field(min_length=1)
    radiologist: str = Field(min_length=1)
