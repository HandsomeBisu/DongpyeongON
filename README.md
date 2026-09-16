# DongpyeongON

동평중학교 학생과 학교를 위한 커뮤니티 웹 애플리케이션입니다.

## 기술 스택

- Next.js App Router + TypeScript
- Tailwind CSS
- Firebase Authentication, Firestore, Storage, Admin SDK
- Spotify Web API + Web Playback SDK
- Vercel

## 로컬 실행

Node.js 22 이상이 필요합니다. `firebase-admin`의 서버 런타임 요구사항 때문에 Vercel에서도 Node.js 22 이상을 사용해야 합니다.

1. Firebase Authentication에서 Google 로그인과 이메일/비밀번호 로그인을 활성화합니다.
2. `.env.example`을 `.env.local`로 복사하고 Firebase Admin SDK와 SMTP 값을 입력합니다.
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
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
EMAIL_VERIFICATION_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=
NEIS_API_KEY=
ADMIN_USERS_PASSWORD=
ADMIN_MUSIC_PASSWORD=
ADMIN_COMMUNITY_PASSWORD=
ADMIN_SESSION_SECRET=
WAITING_ROOM_ENABLED=false
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
QUEUE_SIGNING_SECRET=
```

이메일/비밀번호 가입은 Firebase 계정을 만든 뒤 자체 SMTP로 6자리 인증 코드를 발송합니다. 코드는 해시로만 저장되며 10분 후 만료되고, 계정별 60초 재발송 제한, IP별 10분당 100회 요청 제한, 5회 입력 제한이 적용됩니다. `SMTP_PORT=465`이면 일반적으로 `SMTP_SECURE=true`, STARTTLS를 사용하는 `587`이면 `false`로 설정합니다. `EMAIL_VERIFICATION_SECRET`은 32자 이상의 별도 무작위 값이어야 합니다.

`ADMIN_SESSION_SECRET`은 관리자 영역 세션 쿠키 서명에 사용되며 32자 이상의 무작위 값으로 설정합니다. 관리자 영역 비밀번호는 브라우저 번들이나 저장소에 포함되지 않습니다.

## Redis 대기열

동시 이용자는 Redis 기반 대기열에서 최대 100명으로 제한할 수 있습니다. Upstash Redis 데이터베이스를 만든 뒤 REST URL과 토큰, 32자 이상의 별도 서명 키를 Vercel 환경 변수에 등록하고 `WAITING_ROOM_ENABLED=true`로 바꾼 다음 다시 배포합니다. Vercel Upstash 연동이 `KV_REST_API_URL`, `KV_REST_API_TOKEN`을 제공하는 경우에도 동작합니다.

입장 권한은 3분 동안 유지되고 사이트를 열어 둔 동안 45초마다 자동 갱신됩니다. 비활성 이용자의 자리는 만료 후 자동 반환됩니다. Redis 연결 정보 없이 대기열만 활성화하면 보호를 위해 입장을 차단하므로, 환경 변수를 모두 등록한 뒤 활성화해야 합니다.

Spotify 검색과 신청 API는 Firebase 학교 계정 인증을 다시 검증합니다. 신청 한도는 한국 시간 오전 7시부터 다음 날 오전 7시까지 사용자당 한 곡이며, 서버에서 중복 문서 생성을 차단합니다. 관리자 웹 플레이어를 사용하려면 Spotify Developer Dashboard에 `SPOTIFY_REDIRECT_URI`를 Redirect URI로 정확히 등록하고 Spotify Premium 계정을 연결해야 합니다. 운영 환경의 예시는 `https://dpon.dpsteam.kr/api/admin/spotify/callback`입니다.

홈의 급식과 시간표는 NEIS 교육정보 Open API를 사용합니다. 동평중학교 급식은 학교 코드로 고정하며, 시간표는 인증된 사용자의 온보딩 학년·반을 서버에서 읽어 조회합니다. 기본 인증키가 서버 코드에 포함되어 있고, 필요하면 `NEIS_API_KEY`로 교체할 수 있습니다.

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
- 관리자 도구는 영역별 환경 변수 비밀번호와 서버에서 서명한 HttpOnly 세션 쿠키로 보호합니다.
- 신문고 조회/저장은 Firebase Admin SDK를 사용하는 서버 Route Handler를 통합니다.
- Firestore와 Storage Rules는 배포 전 Emulator 테스트를 추가해야 합니다.

`/admin` 접근에는 Firebase 관리자 역할이 필요하지 않으며 각 관리 영역의 전용 비밀번호를 사용합니다. 사용자 관리에서 역할을 변경한 경우 대상 사용자는 다시 로그인해야 새 권한이 적용됩니다.
