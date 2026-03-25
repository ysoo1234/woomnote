import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { submitLessonNote } from "@/lib/queries/mutations";

const submissionSchema = z.object({
  lessonId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
  isPublic: z.boolean().default(false),
  removeAttachment: z.boolean().default(false),
});

const MAX_SERVER_UPLOAD_BYTES = 4_500_000;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const rawImage = formData.get("image");
  const imageFile = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;

  const parsed = submissionSchema.safeParse({
    lessonId: formData.get("lessonId"),
    content: formData.get("content"),
    isPublic: formData.get("isPublic") === "true",
    removeAttachment: formData.get("removeAttachment") === "true",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "입력값을 다시 확인해주세요.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (imageFile && imageFile.size > MAX_SERVER_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        message:
          "서버 업로드는 4.5MB 이하 이미지만 지원해요. 조금 더 작은 이미지를 올려주세요.",
      },
      { status: 400 },
    );
  }

  try {
    let attachment:
      | {
          fileName: string;
          fileUrl: string;
          mimeType: string | null;
          fileSizeBytes: number;
        }
      | null = null;

    if (imageFile) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json(
          {
            message:
              "BLOB_READ_WRITE_TOKEN이 아직 설정되지 않았어요. Vercel Blob 연결 후 다시 시도해주세요.",
          },
          { status: 500 },
        );
      }

      const blob = await put(
        `submissions/${session.user.id}/${Date.now()}-${imageFile.name}`,
        imageFile,
        {
          access: "public",
          addRandomSuffix: true,
          contentType: imageFile.type,
        },
      );

      attachment = {
        fileName: imageFile.name,
        fileUrl: blob.url,
        mimeType: imageFile.type || null,
        fileSizeBytes: imageFile.size,
      };
    }

    const submissionId = await submitLessonNote({
      studentUserId: session.user.id,
      lessonId: parsed.data.lessonId,
      content: parsed.data.content,
      isPublic: parsed.data.isPublic,
      attachment,
      removeAttachment: parsed.data.removeAttachment,
    });

    return NextResponse.json({ ok: true, submissionId, attachment });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "제출 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
