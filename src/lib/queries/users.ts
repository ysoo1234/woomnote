import { db } from "@/lib/db";

type UserRole = "student" | "teacher";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function findUserByEmailAndRole(input: {
  email: string;
  role: "student" | "teacher";
}): Promise<AppUser | null> {
  if (!db) {
    return null;
  }

  const result = await db.sql<AppUser>`
    select id, email, name, role
    from users
    where lower(email) = lower(${input.email})
      and role = ${input.role}
    limit 1
  `;

  return result.rows[0] ?? null;
}
