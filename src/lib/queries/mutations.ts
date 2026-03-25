import {
  buildFallbackFeedback,
  generateFeedbackWithOpenAI,
} from "@/lib/ai-feedback";
import { db, withDbRetry } from "@/lib/db";

type CreateLessonInput = {
  teacherUserId: string;
  subject: string;
  lessonDate: string;
  title: string;
  description: string;
  allowPublicFeed: boolean;
};

type SubmitLessonInput = {
  studentUserId: string;
  lessonId: string;
  content: string;
  isPublic: boolean;
  attachment?:
    | {
        fileName: string;
        fileUrl: string;
        mimeType: string | null;
        fileSizeBytes: number;
      }
    | null;
  removeAttachment?: boolean;
};

function toPgTextArray(values: string[]) {
  const escaped = values.map((value) =>
    `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
  );
  return `{${escaped.join(",")}}`;
}

export async function createLessonForTeacher(input: CreateLessonInput) {
  if (!db) {
    throw new Error("Database is not configured.");
  }

  const database = db;

  const classroomResult = await withDbRetry(() => database.sql<{ id: string }>`
    select id
    from classrooms
    where teacher_user_id = ${input.teacherUserId}
    order by grade asc, class_number asc
    limit 1
  `);

  const classroomId = classroomResult.rows[0]?.id;

  if (!classroomId) {
    throw new Error("Teacher classroom not found.");
  }

  const lessonResult = await withDbRetry(() => database.sql<{ id: string }>`
    insert into lessons (
      classroom_id,
      teacher_user_id,
      subject,
      lesson_date,
      title,
      description,
      allow_public_feed,
      status
    )
    values (
      ${classroomId},
      ${input.teacherUserId},
      ${input.subject},
      ${input.lessonDate},
      ${input.title},
      ${input.description},
      ${input.allowPublicFeed},
      'published'
    )
    returning id
  `);

  const lessonId = lessonResult.rows[0]?.id;

  if (!lessonId) {
    throw new Error("Lesson creation failed.");
  }

  await withDbRetry(() => database.sql`
    insert into lesson_rubric_items (
      lesson_id,
      position,
      title,
      excellent_points,
      average_points,
      basic_points,
      excellent_criteria,
      average_criteria,
      basic_criteria
    )
    values
      (
        ${lessonId},
        1,
        '내용 이해와 정리',
        4,
        2,
        0,
        '수업 내용을 정확하고 자연스럽게 정리했다.',
        '수업 내용을 부분적으로 정리했다.',
        '수업 내용을 충분히 정리하지 못했다.'
      ),
      (
        ${lessonId},
        2,
        '자기 생각 표현',
        4,
        2,
        0,
        '배운 점과 생각을 자신의 말로 분명하게 표현했다.',
        '생각을 간단하게 표현했다.',
        '자기 생각 표현이 거의 없다.'
      )
  `);

  return lessonId;
}

export async function submitLessonNote(input: SubmitLessonInput) {
  if (!db) {
    throw new Error("Database is not configured.");
  }

  const database = db;

  const lessonAccess = await withDbRetry(() => database.sql<{
    lessonId: string;
    subject: string;
    title: string;
    description: string;
    allowPublicFeed: boolean;
  }>`
    select
      l.id as "lessonId",
      l.subject,
      l.title,
      l.description,
      l.allow_public_feed as "allowPublicFeed"
    from lessons l
    join classroom_members cm
      on cm.classroom_id = l.classroom_id
    where l.id = ${input.lessonId}
      and cm.user_id = ${input.studentUserId}
      and l.status = 'published'
    limit 1
  `);

  const lesson = lessonAccess.rows[0];

  if (!lesson) {
    throw new Error("Lesson not found for this student.");
  }

  const submissionResult = await withDbRetry(() => database.sql<{ id: string }>`
    insert into submissions (
      lesson_id,
      student_user_id,
      content,
      is_public,
      status,
      submitted_at
    )
    values (
      ${input.lessonId},
      ${input.studentUserId},
      ${input.content},
      ${lesson.allowPublicFeed ? input.isPublic : false},
      'submitted',
      now()
    )
    on conflict (lesson_id, student_user_id)
    do update
    set
      content = excluded.content,
      is_public = excluded.is_public,
      status = excluded.status,
      submitted_at = excluded.submitted_at
    returning id
  `);

  const submissionId = submissionResult.rows[0]?.id;

  if (!submissionId) {
    throw new Error("Submission failed.");
  }

  if (input.removeAttachment) {
    await withDbRetry(() => database.sql`
      delete from submission_attachments
      where submission_id = ${submissionId}
    `);
  }

  const attachment = input.attachment;

  if (attachment) {
    await withDbRetry(() => database.sql`
      delete from submission_attachments
      where submission_id = ${submissionId}
    `);

    await withDbRetry(() => database.sql`
      insert into submission_attachments (
        submission_id,
        file_name,
        file_url,
        mime_type,
        file_size_bytes
      )
      values (
        ${submissionId},
        ${attachment.fileName},
        ${attachment.fileUrl},
        ${attachment.mimeType},
        ${attachment.fileSizeBytes}
      )
    `);
  }

  const rubricResult = await withDbRetry(() => database.sql<{ maxScore: number }>`
    select coalesce(sum(excellent_points), 12)::int as "maxScore"
    from lesson_rubric_items
    where lesson_id = ${input.lessonId}
  `);

  const maxScore = rubricResult.rows[0]?.maxScore ?? 12;

  const aiFeedback =
    (await generateFeedbackWithOpenAI({
      subject: lesson.subject,
      title: lesson.title,
      description: lesson.description,
      content: input.content,
      maxScore,
      attachmentUrl: attachment?.fileUrl ?? null,
    })) ?? buildFallbackFeedback(input.content, maxScore);

  const strengthsArray = toPgTextArray(aiFeedback.strengths);
  const improvementsArray = toPgTextArray(aiFeedback.improvements);

  await withDbRetry(() => database.sql`
    insert into submission_feedbacks (
      submission_id,
      total_score,
      max_score,
      summary,
      strengths,
      improvements,
      status,
      model_name,
      generated_at
    )
    values (
      ${submissionId},
      ${aiFeedback.totalScore},
      ${aiFeedback.maxScore},
      ${aiFeedback.summary},
      cast(${strengthsArray} as text[]),
      cast(${improvementsArray} as text[]),
      'completed',
      ${aiFeedback.modelName},
      now()
    )
    on conflict (submission_id)
    do update
    set
      total_score = excluded.total_score,
      max_score = excluded.max_score,
      summary = excluded.summary,
      strengths = excluded.strengths,
      improvements = excluded.improvements,
      status = excluded.status,
      model_name = excluded.model_name,
      generated_at = excluded.generated_at
  `);

  return submissionId;
}
