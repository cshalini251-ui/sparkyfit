@echo off
cd SparkyFitnessGarmin
for /f "tokens=1* delims==" %%a in (..\.env) do (
    if "%%a"=="GARMIN_SERVICE_PORT" set GARMIN_SERVICE_PORT=%%b
)
call venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port %GARMIN_SERVICE_PORT% --reload
pause