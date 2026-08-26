@echo off
echo =========================================================================
echo  AI-Assisted Adverse Drug Reaction (ADR) Reporting System
echo =========================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "ADR Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React + TypeScript Frontend on http://localhost:5173 ...
start "ADR Frontend (React Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application successfully launched!
echo - Frontend: http://localhost:5173
echo - Backend API & Swagger Docs: http://localhost:8000/docs
echo.
pause
