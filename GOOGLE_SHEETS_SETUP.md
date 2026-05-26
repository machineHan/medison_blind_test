# Google Sheets 수집 설정

## 1. Google Sheet 만들기

Google Drive에서 새 Spreadsheet를 만들고 첫 시트 이름을 `responses`로 바꿉니다.

## 2. Apps Script 코드 넣기

Spreadsheet 상단 메뉴에서 `확장 프로그램 → Apps Script`로 이동한 뒤, 이 프로젝트의 `apps_script/Code.gs` 내용을 그대로 붙여넣고 저장합니다.

## 3. 웹 앱 배포

Apps Script에서:

- `배포 → 새 배포`
- 유형: `웹 앱`
- 실행 사용자: `나`
- 액세스 권한: `모든 사용자`
- 배포

생성된 Web App URL을 복사합니다.

## 4. React 앱에 URL 넣기

루트에 `.env` 파일을 만들고 아래처럼 입력합니다.

```bash
VITE_GOOGLE_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/여기에_배포_URL/exec
```

GitHub Pages 배포 시에는 `.env`도 함께 커밋하거나, GitHub Actions를 쓰는 경우 repository secret으로 넣어야 합니다.

## 5. 빌드 및 배포

```bash
npm install
npm run build
npx gh-pages -d dist
```

## 6. 저장 확인

웹페이지 시작 화면에서 `저장 모드: Google Sheets`로 보이면 Sheets 저장 모드입니다.

점수를 누르면 `responses` 시트에 한 줄씩 누적됩니다.
결과 페이지는 5초마다 Apps Script를 통해 Sheets 내용을 다시 읽어 집계합니다.
