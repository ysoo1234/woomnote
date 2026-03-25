import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StudentDashboard } from "@/components/student/student-dashboard";
import {
  getStudentLessons,
  getStudentPublicNotes,
  type StudentPublicNoteCard,
} from "@/lib/queries/dashboard";

export default async function StudentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/student");
  }

  const lessons = await getStudentLessons(session.user.id);

  let publicNotes: StudentPublicNoteCard[] = [];
  try {
    publicNotes = await getStudentPublicNotes(session.user.id);
  } catch (error) {
    console.error("Failed to load public student notes:", error);
  }

  return (
    <StudentDashboard
      studentName={session.user.name ?? "움 친구"}
      studentEmail={session.user.email ?? ""}
      lessons={lessons}
      publicNotes={publicNotes}
    />
  );
}
