from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from pydantic import BaseModel
from database import Base, engine
import models
from routers import documents, summaries, diagrams, diseases, quizzes, folders
from config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedStudy AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)
        if request.url.path in ["/health", "/auth/login"]:
            return await call_next(request)
        if not request.url.path.startswith("/api"):
            return await call_next(request)
        if not settings.APP_PASSWORD:
            return await call_next(request)
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {settings.APP_PASSWORD}":
            return JSONResponse({"detail": "No autorizado"}, status_code=401)
        return await call_next(request)


app.add_middleware(AuthMiddleware)


class LoginRequest(BaseModel):
    password: str


@app.post("/auth/login")
def login(req: LoginRequest):
    if req.password != settings.APP_PASSWORD:
        raise HTTPException(401, "Contraseña incorrecta")
    return {"token": settings.APP_PASSWORD}


@app.get("/health")
def health():
    return {"status": "ok", "app": "MedStudy AI"}


app.include_router(documents.router, prefix="/api")
app.include_router(summaries.router, prefix="/api")
app.include_router(diagrams.router, prefix="/api")
app.include_router(diseases.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(folders.router, prefix="/api")

# Serve frontend static assets
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException
            raise HTTPException(404, "Not found")
        return FileResponse(str(static_dir / "index.html"))
