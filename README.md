# 동평ON

동평중학교 학생과 학교를 위한 커뮤니티 웹 애플리케이션입니다.

## 기술 스택

- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Authentication, Firestore, Storage, Admin SDK
- Spotify Web API / Web Playback SDK (추후 연결)
- Vercel

## 로컬 실행

1. `.env.example`을 `.env.local`로 복사하고 Firebase 값을 입력합니다.
2. Firebase Authentication에서 Google 로그인을 활성화합니다.
3. 아래 명령을 실행합니다.

```bash
pnpm install
pnpm dev
```

Firebase 값이 없어도 초기 화면은 실행되며 로그인 버튼 대신 설정 안내가 표시됩니다.

학교 Google Workspace 도메인이 있다면 `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`에
`school.example.kr`처럼 `@`를 제외한 도메인을 입력합니다.

## Firebase 규칙과 인덱스 배포

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 보안 주의사항

- `NEXT_PUBLIC_*` 외의 비밀값은 클라이언트 컴포넌트에서 사용하지 않습니다.
- 관리자 역할은 Firebase Auth Custom Claims로 부여합니다.
- 신문고 조회/저장은 Firebase Admin SDK를 사용하는 서버 Route Handler를 통합니다.
- Firestore와 Storage Rules는 배포 전 Emulator 테스트를 추가해야 합니다.

최초 관리자 계정에는 Firebase Admin SDK로 Authentication Custom Claim
`role: "admin"`을 한 번 부여해야 합니다. 이후에는 `/admin`에서 학생·교사·관리자
역할을 변경할 수 있으며, 변경된 사용자는 다시 로그인해야 새 권한이 적용됩니다.
