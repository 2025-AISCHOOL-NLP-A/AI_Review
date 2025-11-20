# Java 설치 및 설정 가이드 (Windows)

KoNLPy를 사용하려면 Java가 필요합니다. Java가 설치되지 않은 경우 워드클라우드는 간단한 텍스트 분리 방식으로 동작하지만, 형태소 분석의 정확도가 낮을 수 있습니다.

## Java 설치 방법

### 1. Java JDK 다운로드
- Oracle JDK 또는 OpenJDK를 다운로드합니다.
- 권장: [Adoptium (Eclipse Temurin)](https://adoptium.net/) - 무료, 오픈소스
- 또는 [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)

### 2. Java 설치
- 다운로드한 설치 파일을 실행하여 설치합니다.
- 설치 경로를 기억해두세요 (예: `C:\Program Files\Java\jdk-17`)

### 3. JAVA_HOME 환경 변수 설정

#### Windows 10/11:
1. **시스템 속성** 열기
   - `Win + R` → `sysdm.cpl` 입력 → Enter
   - 또는 제어판 → 시스템 → 고급 시스템 설정

2. **환경 변수** 클릭

3. **시스템 변수**에서 **새로 만들기** 클릭
   - 변수 이름: `JAVA_HOME`
   - 변수 값: Java 설치 경로 (예: `C:\Program Files\Java\jdk-17`)

4. **Path** 변수 편집
   - 시스템 변수에서 `Path` 선택 → 편집
   - 새로 만들기 → `%JAVA_HOME%\bin` 추가

5. **확인** 클릭하여 저장

### 4. 설치 확인
명령 프롬프트(cmd) 또는 PowerShell에서:
```bash
java -version
javac -version
echo %JAVA_HOME%
```

정상적으로 설치되었다면 Java 버전이 출력됩니다.

### 5. 모델 서버 재시작
Java 설치 후 모델 서버를 재시작하세요:
```bash
cd model_server
python main.py
```

## 참고사항

- Java가 설치되지 않은 경우에도 워드클라우드는 생성되지만, 형태소 분석 없이 간단한 단어 분리 방식으로 동작합니다.
- 더 정확한 형태소 분석을 원한다면 Java 설치를 권장합니다.
- Java 8 이상 버전을 권장합니다.

