import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { z } from "zod";
import { findUserByEmailAndRole } from "@/lib/queries/users";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["student", "teacher"]).default("student"),
});

const mailServer =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    : null;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Demo credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "student@example.com",
        },
        role: {
          label: "Role",
          type: "text",
          placeholder: "student or teacher",
        },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const { email, role } = parsed.data;
        const user = await findUserByEmailAndRole({ email, role });

        if (!user) {
          return null;
        }

        return user;
      },
    }),
    ...(mailServer && process.env.SMTP_FROM
      ? [
          Nodemailer({
            server: mailServer,
            from: process.env.SMTP_FROM,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: "student" | "teacher" }).role ?? "student";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.role = token.role === "teacher" ? "teacher" : "student";
      }

      return session;
    },
  },
});
