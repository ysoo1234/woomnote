import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";
import {
  getTeacherLessonOverview,
  getTeacherStudentNotes,
} from "@/lib/queries/dashboard";

export default async function TeacherPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/teacher");
  }

  if (session.user.role !== "teacher") {
    redirect("/student");
  }

  const [lessons, notes] = await Promise.all([
    getTeacherLessonOverview(session.user.id),
    getTeacherStudentNotes(session.user.id),
  ]);

  return (
    <div className="bg-[#f7fbf8]">
      <div className="mx-auto flex max-w-[1440px] justify-end gap-3 px-5 pt-4 md:px-8">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-strong)] shadow-sm"
        >
          홈으로
        </Link>
        <SignOutButton className="rounded-full bg-[#60b384] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#52a075]" />
      </div>

      <TeacherDashboard
        teacherName={session.user.name ?? "선생님"}
        teacherEmail={session.user.email ?? ""}
        lessons={lessons}
        notes={notes}
      />
    </div>
  );
}
