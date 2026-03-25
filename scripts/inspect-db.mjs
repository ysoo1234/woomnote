import fs from "node:fs";
import path from "node:path";
import { createPool } from "@vercel/postgres";

function loadDotEnv(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const envText = fs.readFileSync(filepath, "utf8");

  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const rootDir = process.cwd();
loadDotEnv(path.join(rootDir, ".env.local"));

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL or DATABASE_URL in environment.");
  process.exit(1);
}

const db = createPool({ connectionString });

try {
  const counts = await db.sql`
    select
      (select count(*)::int from lessons) as lessons,
      (select count(*)::int from submissions) as submissions,
      (select count(*)::int from submission_feedbacks) as feedbacks
  `;

  const lessons = await db.sql`
    select subject, title, to_char(lesson_date, 'YYYY-MM-DD') as lesson_date
    from lessons
    order by lesson_date desc, created_at desc
    limit 5
  `;

  const submissions = await db.sql`
    select u.name, l.title, s.is_public
    from submissions s
    join users u on u.id = s.student_user_id
    join lessons l on l.id = s.lesson_id
    order by s.created_at desc
    limit 5
  `;

  console.log(
    JSON.stringify(
      {
        counts: counts.rows[0],
        lessons: lessons.rows,
        submissions: submissions.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await db.end();
}
