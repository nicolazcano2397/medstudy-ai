from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    DATABASE_URL: str = "sqlite:///./medstudy.db"
    CLAUDE_MODEL: str = "claude-sonnet-4-6"
    UPLOAD_DIR: str = "./uploads"
    APP_PASSWORD: str

    class Config:
        env_file = ".env"

settings = Settings()
