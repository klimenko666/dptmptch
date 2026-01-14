@echo off
echo ====================================
echo   Удаление базы данных TempTeachers
echo ====================================
echo.

cd /d "%~dp0"

echo 🗑️ Удаление temp_teachers.db...
if exist "backend\database\temp_teachers.db" (
    del "backend\database\temp_teachers.db"
    echo ✅ База данных удалена
) else (
    echo ℹ️ Файл базы данных не найден
)

echo.
echo 🎉 Готово! Теперь запустите сервер:
echo    node backend/server.js
echo.
pause