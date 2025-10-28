@echo off
echo Starting AI Review Analysis Services...

echo.
echo [1/2] Starting Python AI Service...
start "Python AI Service" cmd /k "cd ai-analysis-service && python main.py"

echo.
echo [2/2] Starting Node.js Web Service...
timeout /t 3 /nobreak > nul
start "Node.js Web Service" cmd /k "npm start"

echo.
echo Services are starting...
echo Python AI Service: http://localhost:8000
echo Node.js Web Service: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul