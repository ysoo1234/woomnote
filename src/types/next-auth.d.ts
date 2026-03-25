import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "student" | "teacher";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "student" | "teacher";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "teacher";
  }
}
