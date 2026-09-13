# 동평ON

동평중학교 학생과 학교를 위한 커뮤니티 웹 애플리케이션입니다.

## 기술 스택

- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Authentication, Firestore, Storage, Admin SDK
- Spotify Web API
- Vercel

## 로컬 실행

1. Firebase Authentication에서 Google 로그인과 이메일/비밀번호 로그인을 활성화합니다.
2. 서버 기능이 필요하면 `.env.example`을 `.env.local`로 복사하고 Firebase Admin SDK 값을 입력합니다.
3. 아래 명령을 실행합니다.

```bash
pnpm install
pnpm dev
```

Firebase Web SDK의 공개 프로젝트 정보는 `src/lib/firebase/config.ts`에 포함되어 있습니다.
로그인과 데이터 접근은 인증을 마친 `@dongpyeong.ms.kr` 학교 계정으로 제한됩니다.

## Vercel 환경 변수

다음 값은 모두 서버 전용이므로 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

```text
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
ADMIN_USERS_PASSWORD=
ADMIN_MUSIC_PASSWORD=
ADMIN_COMMUNITY_PASSWORD=
ADMIN_SESSION_SECRET=
```

`ADMIN_SESSION_SECRET`은 관리자 영역 세션 쿠키 서명에 사용되며 32자 이상의 무작위 값으로 설정합니다. 관리자 영역 비밀번호는 브라우저 번들이나 저장소에 포함되지 않습니다.

Spotify 검색과 신청 API는 Firebase 학교 계정 인증을 다시 검증합니다. 신청 한도는 한국 시간 오전 7시부터 다음 날 오전 7시까지 사용자당 한 곡이며, 서버에서 중복 문서 생성을 차단합니다.

## Firebase 규칙과 인덱스 배포

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 보안 주의사항

- Firebase Web SDK 설정값은 공개 식별 정보이며, Admin SDK 비공개 키는 서버 환경 변수로만 관리합니다.
- 관리자 역할은 Firebase Auth Custom Claims로 부여합니다.
- 관리자 도구는 Custom Claim 확인 후 영역별 환경 변수 비밀번호를 추가로 검증합니다.
- 신문고 조회/저장은 Firebase Admin SDK를 사용하는 서버 Route Handler를 통합니다.
- Firestore와 Storage Rules는 배포 전 Emulator 테스트를 추가해야 합니다.

최초 관리자 계정에는 Firebase Admin SDK로 Authentication Custom Claim
`role: "admin"`을 한 번 부여해야 합니다. 이후에는 `/admin`에서 학생·교사·관리자
역할을 변경할 수 있으며, 변경된 사용자는 다시 로그인해야 새 권한이 적용됩니다.
