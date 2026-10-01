from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List, Union
import json


DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]


class Settings(BaseSettings):
    APP_NAME: str = "LeadPilot AI"
    ENVIRONMENT: str = "development"
    BACKEND_CORS_ORIGINS: Union[List[str], str] = DEFAULT_DEV_ORIGINS

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        origins: set[str] = set(DEFAULT_DEV_ORIGINS)
        if isinstance(v, str):
            v_str = v.strip()
            if v_str:
                if v_str.startswith("[") and v_str.endswith("]"):
                    try:
                        items = json.loads(v_str)
                        origins.update(items)
                    except Exception:
                        pass
                else:
                    items = [item.strip() for item in v_str.split(",") if item.strip()]
                    origins.update(items)
        elif isinstance(v, list):
            origins.update(v)
        return sorted(list(origins))

    # Gemini configuration — values come from backend/.env
    # Never hardcode these in source code.
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
