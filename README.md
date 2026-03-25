# WoomNote

움노트(`WoomNote`)용 Next.js 16 기본 뼈대입니다. 학생/교사 화면 분기, Auth.js v5 설정, Neon용 SQL 스키마, DB 연결 확인 API까지 먼저 잡아둔 상태예요.

## 현재 포함된 것
- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- Auth.js(NextAuth v5 beta) 기본 설정
- 학생/교사 대시보드 라우트
- `db/schema.sql` 기반 Postgres 스키마 초안
- `POSTGRES_URL` 또는 `DATABASE_URL` 기반 DB 연결 체크
- Nodemailer 연동 초안
- React Compiler 활성화

## 시작 방법

1. `.env.example`를 참고해서 `.env.local`을 만듭니다.
2. 최소한 아래 값은 채워둡니다.

```env
AUTH_SECRET=...
POSTGRES_URL=...
```

3. 개발 서버를 실행합니다.

```bash
npm run dev
```

4. 브라우저에서 `http://localhost:3000`을 엽니다.

## DB 만드는 방법

가장 쉬운 방법:

1. Neon 콘솔의 SQL Editor를 엽니다.
2. [db/schema.sql](C:/Users/YSJ/Desktop/dev/songsongnote/WoomNote/db/schema.sql) 내용을 붙여넣고 실행합니다.

이 파일은 아래 구조를 만듭니다.

- `users`
- `classrooms`
- `classroom_members`
- `lessons`
- `lesson_rubric_items`
- `submissions`
- `submission_attachments`
- `submission_feedbacks`

## 그다음에 하면 좋은 것
- 실제 DB 연결 후 테이블 생성 확인
- 기존 Figma 학생 화면을 Next App Router로 이식
- 교사용 수업 생성 화면 연결
- 제출/피드백 저장 쿼리 작성

## 참고 메모

- 지금 Neon 연동에서는 `@vercel/postgres`가 deprecated 경고를 줄 수 있습니다.
- 그래서 DB 접근은 `src/lib/db.ts`에 모아두었고, 후속 작업에서 Neon SDK로 바꾸기 쉽게 해둔 상태입니다.
- 현재 로컬 Node가 `20.11.1`이면 일부 ESLint 패키지에서 엔진 경고가 보일 수 있어 `20.19+` 업그레이드를 권장합니다.
