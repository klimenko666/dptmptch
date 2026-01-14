@echo off
echo Initializing database...
cd /d "%~dp0"
if not exist "backend\database\temp_teachers.db" (
    echo Database file not found, creating...
    type nul > "backend\database\temp_teachers.db"
)

echo Running database initialization...
node fix_db.js

if %errorlevel% neq 0 (
    echo Database initialization failed
    pause
    exit /b 1
)

echo Starting server...
node backend/server.js