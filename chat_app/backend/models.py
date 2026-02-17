from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class Role(str, Enum):
    user = "user"
    agent = "agent"


class MessageCreate(BaseModel):
    role: Role
    content: str


class Message(BaseModel):
    id: int
    role: Role
    content: str
    timestamp: datetime


class MessageListResponse(BaseModel):
    messages: list[Message]
    has_more: bool
