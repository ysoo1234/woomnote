import { createPool } from "@vercel/postgres";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

export const db = connectionString
  ? createPool({
      connectionString,
    })
  : null;

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
  },
) {
  const retries = options?.retries ?? 1;
  const delayMs = options?.delayMs ?? 250;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

export async function checkDatabaseConnection() {
  if (!db) {
    return {
      ok: false,
      message:
        "POSTGRES_URL 또는 DATABASE_URL이 아직 설정되지 않았어요. .env.local부터 넣으면 바로 확인할 수 있습니다.",
    };
  }

  try {
    const result = await withDbRetry(() =>
      db.sql<{ now: string }>`select now() as now`,
    );

    return {
      ok: true,
      now: result.rows[0]?.now ?? null,
      message: "Database connection succeeded.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown database error",
    };
  }
}
