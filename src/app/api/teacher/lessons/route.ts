import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { createLessonForTeacher } from "@/lib/queries/mutations";

const createLessonSchema = z.object({
  subject: z.string().trim().min(1).max(30),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  allowPublicFeed: z.boolean().default(true),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createLessonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력값을 다시 확인해주세요.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const lessonId = await createLessonForTeacher({
      teacherUserId: session.user.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true, lessonId });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "수업 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
