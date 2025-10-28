@echo off
echo Starting AI Analysis Service...
echo.

REM 가상환경 활성화 (존재하는 경우)
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM 의존성 설치 확인
echo Checking dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo API Documentation: http://localhost:8000/docs
echo.

python main.py