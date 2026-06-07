#!/bin/bash
# Arrancar MedStudy AI — abre dos terminales automáticamente

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Terminal 1: Backend
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && source venv/bin/activate && uvicorn main:app --reload --port 8000\""

# Terminal 2: Frontend
osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && npm run dev\""

echo "Abriendo backend (puerto 8000) y frontend (puerto 5173)..."
echo "App disponible en: http://localhost:5173"
