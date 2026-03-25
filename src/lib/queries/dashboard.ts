import { db, withDbRetry } from "@/lib/db";

export type StudentLessonCard = {
  lessonId: string;
  classroomTitle: string;
  subject: string;
  title: string;
  description: string;
  lessonDate: string;
  lessonStatus: string;
  submissionId: string | null;
  submissionStatus: string | null;
  submissionContent: string | null;
  attachmentUrl: string | null;
  isPublic: boolean | null;
  totalScore: number | null;
  maxScore: number | null;
  feedbackSummary: string | null;
  feedbackStrengths: string[];
  feedbackImprovements: string[];
};

export type StudentPublicNoteCard = {
  submissionId: string;
  lessonId: string;
  classroomTitle: string;
  subject: string;
  title: string;
  lessonDate: string;
  authorName: string;
  studentNumber: number | null;
  content: string;
  attachmentUrl: string | null;
};

export type TeacherLessonOverview = {
  lessonId: string;
  classroomTitle: string;
  subject: string;
  title: string;
  lessonDate: string;
  lessonStatus: string;
  studentCount: number;
  submissionCount: number;
};

export type TeacherStudentNote = {
  submissionId: string;
  lessonId: string;
  classroomTitle: string;
  subject: string;
  title: string;
  lessonDate: string;
  studentUserId: string;
  studentName: string;
  studentNumber: number | null;
  content: string;
  attachmentUrl: string | null;
  isPublic: boolean;
  totalScore: number | null;
  maxScore: number | null;
  feedbackSummary: string | null;
  feedbackStrengths: string[];
  feedbackImprovements: string[];
};

export async function getStudentLessons(
  userId: string,
): Promise<StudentLessonCard[]> {
  if (!db) {
    return [];
  }

  const database = db;

  const result = await withDbRetry(() => database.sql<StudentLessonCard>`
    select
      l.id as "lessonId",
      c.title as "classroomTitle",
      l.subject,
      l.title,
      l.description,
      to_char(l.lesson_date, 'YYYY-MM-DD') as "lessonDate",
      l.status as "lessonStatus",
      s.id as "submissionId",
      s.status as "submissionStatus",
      s.content as "submissionContent",
      sa.file_url as "attachmentUrl",
      s.is_public as "isPublic",
      f.total_score as "totalScore",
      f.max_score as "maxScore",
      f.summary as "feedbackSummary",
      coalesce(f.strengths, '{}'::text[]) as "feedbackStrengths",
      coalesce(f.improvements, '{}'::text[]) as "feedbackImprovements"
    from classroom_members cm
    join classrooms c on c.id = cm.classroom_id
    join lessons l on l.classroom_id = c.id
    left join submissions s
      on s.lesson_id = l.id
     and s.student_user_id = cm.user_id
    left join submission_feedbacks f
      on f.submission_id = s.id
    left join lateral (
      select file_url
      from submission_attachments
      where submission_id = s.id
      order by created_at asc
      limit 1
    ) sa on true
    where cm.user_id = ${userId}
      and l.status = 'published'
    order by l.lesson_date desc, l.created_at desc
  `);

  return result.rows;
}

export async function getStudentPublicNotes(
  userId: string,
): Promise<StudentPublicNoteCard[]> {
  if (!db) {
    return [];
  }

  const database = db;

  const result = await withDbRetry(() => database.sql<StudentPublicNoteCard>`
    select
      s.id as "submissionId",
      l.id as "lessonId",
      c.title as "classroomTitle",
      l.subject,
      l.title,
      to_char(l.lesson_date, 'YYYY-MM-DD') as "lessonDate",
      u.name as "authorName",
      cm_other.student_number as "studentNumber",
      s.content,
      sa.file_url as "attachmentUrl"
    from classroom_members cm_self
    join classroom_members cm_other
      on cm_other.classroom_id = cm_self.classroom_id
     and cm_other.user_id <> cm_self.user_id
    join users u on u.id = cm_other.user_id
    join classrooms c on c.id = cm_self.classroom_id
    join lessons l on l.classroom_id = c.id
    join submissions s
      on s.lesson_id = l.id
     and s.student_user_id = cm_other.user_id
    left join lateral (
      select file_url
      from submission_attachments
      where submission_id = s.id
      order by created_at asc
      limit 1
    ) sa on true
    where cm_self.user_id = ${userId}
      and s.is_public = true
      and s.status = 'submitted'
      and l.status = 'published'
    order by l.lesson_date desc, l.created_at desc, cm_other.student_number asc nulls last, u.name asc
  `);

  return result.rows;
}

export async function getTeacherLessonOverview(
  userId: string,
): Promise<TeacherLessonOverview[]> {
  if (!db) {
    return [];
  }

  const database = db;

  const result = await withDbRetry(() => database.sql<TeacherLessonOverview>`
    with classroom_student_counts as (
      select
        cm.classroom_id,
        count(*)::int as student_count
      from classroom_members cm
      join users u on u.id = cm.user_id
      where u.role = 'student'
      group by cm.classroom_id
    ),
    lesson_submission_counts as (
      select
        s.lesson_id,
        count(*)::int as submission_count
      from submissions s
      where s.status = 'submitted'
      group by s.lesson_id
    )
    select
      l.id as "lessonId",
      c.title as "classroomTitle",
      l.subject,
      l.title,
      to_char(l.lesson_date, 'YYYY-MM-DD') as "lessonDate",
      l.status as "lessonStatus",
      coalesce(csc.student_count, 0) as "studentCount",
      coalesce(lsc.submission_count, 0) as "submissionCount"
    from lessons l
    join classrooms c on c.id = l.classroom_id
    left join classroom_student_counts csc on csc.classroom_id = c.id
    left join lesson_submission_counts lsc on lsc.lesson_id = l.id
    where l.teacher_user_id = ${userId}
    order by l.lesson_date desc, l.created_at desc
  `);

  return result.rows;
}

export async function getTeacherStudentNotes(
  userId: string,
): Promise<TeacherStudentNote[]> {
  if (!db) {
    return [];
  }

  const database = db;

  const result = await withDbRetry(() => database.sql<TeacherStudentNote>`
    select
      s.id as "submissionId",
      l.id as "lessonId",
      c.title as "classroomTitle",
      l.subject,
      l.title,
      to_char(l.lesson_date, 'YYYY-MM-DD') as "lessonDate",
      u.id as "studentUserId",
      u.name as "studentName",
      cm.student_number as "studentNumber",
      s.content,
      sa.file_url as "attachmentUrl",
      s.is_public as "isPublic",
      f.total_score as "totalScore",
      f.max_score as "maxScore",
      f.summary as "feedbackSummary",
      coalesce(f.strengths, '{}'::text[]) as "feedbackStrengths",
      coalesce(f.improvements, '{}'::text[]) as "feedbackImprovements"
    from lessons l
    join classrooms c on c.id = l.classroom_id
    join submissions s on s.lesson_id = l.id
    join users u on u.id = s.student_user_id
    left join classroom_members cm
      on cm.classroom_id = c.id
     and cm.user_id = u.id
    left join submission_feedbacks f
      on f.submission_id = s.id
    left join lateral (
      select file_url
      from submission_attachments
      where submission_id = s.id
      order by created_at asc
      limit 1
    ) sa on true
    where l.teacher_user_id = ${userId}
    order by l.lesson_date desc, l.created_at desc, cm.student_number asc nulls last, u.name asc
  `);

  return result.rows;
}
