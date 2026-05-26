# Medison Blind Test - Google Sheets Collection

React + Vite + Tailwind 기반 평가 웹페이지입니다.

- 47개 평가 샘플
- Candidate 1/2/3 × 5개 평가 지표
- Google Apps Script를 통해 Google Sheets에 점수 저장
- 결과 페이지에서 Google Sheets 데이터를 5초마다 읽어 집계
- Google Sheets URL이 없으면 localStorage 모드로 동작

## 실행

```bash
npm install
npm run dev
```

## 배포

```bash
npm run build
npx gh-pages -d dist
```
