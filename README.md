# TypeScript + Tailwind CSS Chrome 확장 프로그램

TypeScript와 Tailwind CSS를 사용하여 만든 현대적인 Chrome 확장 프로그램입니다.

## 🚀 기능

- **Google OAuth 로그인**: 사용자 계정으로 YouTube 구독 목록 접근
- **YouTube 구독 모니터링**: 구독한 채널의 새 영상 알림
- **TypeScript**: 타입 안전성과 개발자 경험 향상
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크로 빠른 스타일링
- **Webpack**: 모듈 번들링 및 빌드 자동화
- **현대적인 UI**: 그라데이션, 애니메이션, 반응형 디자인

## 📁 프로젝트 구조

```
Chrome-Extention/
├── src/
│   ├── popup.html          # 팝업 HTML 템플릿
│   ├── popup.ts            # TypeScript 메인 로직
│   └── styles.css          # Tailwind CSS 스타일
├── dist/                   # 빌드된 파일들 (자동 생성)
├── manifest.json           # Chrome 확장 프로그램 설정
├── package.json            # 의존성 관리
├── tsconfig.json           # TypeScript 설정
├── tailwind.config.js      # Tailwind CSS 설정
├── webpack.config.js       # Webpack 빌드 설정
└── README.md              # 프로젝트 문서
```

## 🛠️ 설치 및 실행

### 1. Google Cloud Platform 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. **API 및 서비스** → **라이브러리** → **YouTube Data API v3** 활성화
3. **OAuth 동의 화면** 구성 (외부 사용자 유형 선택)
4. **사용자 인증 정보** → **OAuth 클라이언트 ID** 생성 (웹 애플리케이션)
5. **승인된 리디렉션 URI**에 `https://<EXTENSION_ID>.chromiumapp.org/` 추가
   - 확장 ID는 개발 중 `chrome.identity.getRedirectURL()`로 확인 가능

### 2. 환경변수 설정 (권장)

```bash
# Windows (PowerShell)
$env:GOOGLE_CLIENT_ID="your_actual_client_id_here"

# Windows (Command Prompt)
set GOOGLE_CLIENT_ID=your_actual_client_id_here

# Linux/Mac
export GOOGLE_CLIENT_ID=your_actual_client_id_here
```

### 2-1. 또는 config.js 파일 사용

1. `config.example.js`를 `config.js`로 복사
2. `config.js`에서 실제 클라이언트 ID로 교체
3. `config.js`는 `.gitignore`에 포함되어 Git에 업로드되지 않음

```bash
cp config.example.js config.js
# config.js 편집하여 실제 클라이언트 ID 입력
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 모드 실행

```bash
npm run dev
```

이 명령어는 파일 변경을 감지하여 자동으로 빌드합니다.

### 5. 프로덕션 빌드

```bash
npm run build
```

### 6. Chrome 확장 프로그램 설치

1. Chrome 브라우저에서 `chrome://extensions/`로 이동
2. 우측 상단의 "개발자 모드" 토글을 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 버튼 클릭
4. `dist` 폴더를 선택

## 🎨 사용된 기술

- **TypeScript**: 정적 타입 검사
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Webpack**: 모듈 번들러
- **PostCSS**: CSS 후처리
- **Chrome Extension API**: Chrome 확장 프로그램 기능

## 📝 스크립트

- `npm run dev`: 개발 모드 (파일 감시)
- `npm run build`: 프로덕션 빌드
- `npm run clean`: dist 폴더 정리

## 🔧 커스터마이징

### Tailwind CSS 설정 변경
`tailwind.config.js` 파일을 수정하여 테마를 커스터마이징할 수 있습니다.

### TypeScript 설정 변경
`tsconfig.json` 파일을 수정하여 TypeScript 컴파일러 옵션을 조정할 수 있습니다.

### Webpack 설정 변경
`webpack.config.js` 파일을 수정하여 빌드 프로세스를 커스터마이징할 수 있습니다.

## 📄 라이선스

MIT License
