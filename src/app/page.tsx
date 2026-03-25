import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { checkDatabaseConnection } from "@/lib/db";

const stack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS v4",
  "NextAuth v5",
  "PostgreSQL (Neon)",
  "Nodemailer",
  "ESLint",
  "React Compiler",
];

const nextSteps = [
  "Neon SQL Editor에서 db/schema.sql을 실행해서 기본 테이블 만들기",
  "학생과 교사 로그인 흐름을 실제 DB 기반으로 다듬기",
  "학생용 움노트 작성 폼과 제출 저장 연결하기",
  "교사용 수업 생성과 학생별 상세 화면 이어 붙이기",
];

export default async function Home() {
  const session = await auth();
  const database = await checkDatabaseConnection();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f7fbf4_0%,#eff5eb_40%,#edf2ea_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <section className="overflow-hidden rounded-[32px] border border-[color:var(--line)] bg-[linear-gradient(135deg,#5e9a70_0%,#7bb26f_55%,#ebcf7f_100%)] text-white shadow-[0_25px_80px_rgba(70,110,73,0.18)]">
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-10 md:py-10">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/35 bg-white/12 px-4 py-1 text-sm font-medium tracking-[0.18em] uppercase text-white/90">
                WOOMNOTE STARTER
              </div>
              <div className="space-y-3">
                <p className="font-woom-display text-sm tracking-[0.25em] uppercase text-white/80">
                  WoomNote
                </p>
                <h1 className="font-woom-display max-w-2xl text-4xl leading-tight md:text-6xl">
                  움노트의 첫 풀스택 뼈대를 잡아둔 상태예요.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/88 md:text-lg">
                  학생과 교사가 함께 쓰는 움노트를 기준으로 인증, 데이터베이스,
                  기본 대시보드, SQL 스키마, 배포 환경 변경까지 한 번에 정리한
                  출발점입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/student"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--primary-strong)] transition hover:bg-[#f5f7ef]"
                >
                  학생 화면 보기
                </Link>
                <Link
                  href="/teacher"
                  className="rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  교사 화면 보기
                </Link>
                {!session?.user ? (
                  <Link
                    href="/api/auth/signin"
                    className="rounded-full border border-white/35 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    로그인 열기
                  </Link>
                ) : (
                  <SignOutButton />
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/25 bg-[#f8fbf4]/14 p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold tracking-[0.22em] uppercase text-white/75">
                Current Session
              </p>
              {session?.user ? (
                <div className="mt-4 space-y-3 text-sm text-white/92">
                  <div className="rounded-2xl bg-black/10 px-4 py-3">
                    <div className="text-white/65">이메일</div>
                    <div className="mt-1 text-base font-semibold">
                      {session.user.email}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-black/10 px-4 py-3">
                    <div className="text-white/65">역할</div>
                    <div className="mt-1 text-base font-semibold uppercase">
                      {session.user.role}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-black/10 px-4 py-4 text-sm leading-6 text-white/88">
                  아직 로그인하지 않은 상태예요. 지금은 Credentials 기반 임시
                  로그인으로 학생과 교사 흐름을 먼저 확인할 수 있게 해두었습니다.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[0_14px_40px_rgba(34,55,37,0.06)]">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--primary)]">
              Stack
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-[color:var(--card-muted)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary-strong)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[0_14px_40px_rgba(34,55,37,0.06)]">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--primary)]">
              Database
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  database.ok ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-base font-semibold text-[color:var(--foreground)]">
                {database.ok ? "DB 연결 확인됨" : "환경 변수 또는 DB 연결 대기"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-black/65">
              {database.ok
                ? `DB 응답 시간 확인 완료: ${database.now}`
                : database.message}
            </p>
          </article>

          <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[0_14px_40px_rgba(34,55,37,0.06)]">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--primary)]">
              SQL
            </p>
            <p className="mt-4 text-base font-semibold text-[color:var(--foreground)]">
              [db/schema.sql](/C:/Users/YSJ/Desktop/dev/songsongnote/WoomNote/db/schema.sql)
            </p>
            <p className="mt-3 text-sm leading-6 text-black/65">
              이 파일을 Neon SQL Editor에서 실행하면 기본 테이블, enum, 인덱스,
              `updated_at` 트리거까지 한 번에 생성됩니다.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[0_14px_40px_rgba(34,55,37,0.06)]">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--primary)]">
              Next Steps
            </p>
            <h2 className="font-woom-display mt-2 text-2xl text-[color:var(--foreground)]">
              지금 바로 이어서 하면 좋은 순서
            </h2>
            <div className="mt-5 space-y-3">
              {nextSteps.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-2xl bg-[color:var(--card-muted)] px-4 py-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6 text-black/75">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[0_14px_40px_rgba(34,55,37,0.06)]">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[color:var(--primary)]">
              What You Can Give Me
            </p>
            <div className="mt-5 space-y-4 text-sm leading-6 text-black/70">
              <p>
                1. `.env.local`에 `POSTGRES_URL` 또는 `DATABASE_URL`만 있으면 DB
                작업을 계속 이어서 할 수 있어요.
              </p>
              <p>
                2. SMTP 정보를 넣어주면 Auth.js magic link와 서비스 메일까지 바로
                붙일 수 있어요.
              </p>
              <p>
                3. 기존 Figma 시안에서 다음으로 옮기고 싶은 화면을 하나 정하면 그
                화면부터 App Router 기준으로 차근차근 이식하면 됩니다.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
