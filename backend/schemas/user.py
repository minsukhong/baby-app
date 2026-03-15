from pydantic import BaseModel
from typing import Optional
import uuid


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: Optional[str]
    role: str
    provider: str

    class Config:
        from_attributes = True
