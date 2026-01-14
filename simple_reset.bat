@echo off
echo ====================================
echo   TempTeachers - Простой сброс БД
echo ====================================
echo.

cd /d "%~dp0"

echo 🗑️ Удаление старой базы данных...
if exist "backend\database\temp_teachers.db" (
    del "backend\database\temp_teachers.db"
    echo ✅ База данных удалена
) else (
    echo ℹ️ База данных не найдена
)

echo.
echo 🔄 Пересоздание базы данных...
node reset_db.js

if %errorlevel% neq 0 (
    echo ❌ Ошибка пересоздания базы данных
    pause
    exit /b 1
)

echo.
echo 🎉 Готово! База данных сброшена.
echo.
echo 🚀 Запустите сервер командой:
echo    node backend/server.js
echo.
pause