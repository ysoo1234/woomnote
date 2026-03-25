"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, X } from "lucide-react";
import type {
  StudentLessonCard,
  StudentPublicNoteCard,
} from "@/lib/queries/dashboard";

type StudentDashboardProps = {
  studentName: string;
  studentEmail: string;
  lessons: StudentLessonCard[];
  publicNotes: StudentPublicNoteCard[];
};

type TabKey = "home" | "my-learning" | "class-learning";

type DetailState =
  | {
      kind: "feedback";
      lesson: StudentLessonCard;
    }
  | {
      kind: "public-note";
      note: StudentPublicNoteCard;
    }
  | {
      kind: "write";
      lesson: StudentLessonCard;
    }
  | null;

type GroupedPublicNotes = {
  key: string;
  subject: string;
  title: string;
  lessonDate: string;
  notes: StudentPublicNoteCard[];
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "home", label: "오늘 수업" },
  { key: "my-learning", label: "나의 움노트" },
  { key: "class-learning", label: "학급 공개노트" },
];

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${Number(month)}월 ${Number(day)}일`;
}

function isToday(value: string) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return value === `${yyyy}-${mm}-${dd}`;
}

function getGroupedPublicNotes(notes: StudentPublicNoteCard[]): GroupedPublicNotes[] {
  const groups: GroupedPublicNotes[] = [];

  for (const note of notes) {
    const key = `${note.subject}|${note.title}|${note.lessonDate}`;
    const existing = groups.find((group) => group.key === key);

    if (existing) {
      existing.notes.push(note);
      continue;
    }

    groups.push({
      key,
      subject: note.subject,
      title: note.title,
      lessonDate: note.lessonDate,
      notes: [note],
    });
  }

  return groups;
}

function SidebarButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-full px-6 py-2 text-left text-[24px] transition-all ${
        active
          ? "bg-[#add1bc] text-[#124223] shadow-sm before:absolute before:left-[18px] before:top-1/2 before:h-[26px] before:w-[5px] before:-translate-y-1/2 before:rounded-full before:bg-[#60b384]"
          : "bg-white/60 text-[#a0aeab] shadow-sm hover:bg-white hover:text-[#768981]"
      } font-woom-display`}
    >
      <span className={active ? "relative z-10" : ""}>{label}</span>
    </button>
  );
}

function WelcomeCard({
  studentName,
  classroomTitle,
}: {
  studentName: string;
  classroomTitle: string | undefined;
}) {
  return (
    <div className="mx-0 mb-8 mt-[16px] rounded-[32px] bg-[#bad35c] px-[40px] pb-[15px] pt-[27px] shadow-sm">
      <h2 className="font-woom-display mb-2 mt-[-4px] text-4xl font-black text-white">
        안녕, {studentName}
      </h2>
      <p className="text-[26px] font-bold text-[#121d31]">
        {classroomTitle
          ? `${classroomTitle}에서 오늘의 배움을 기록해볼까요?`
          : "오늘의 배움을 기록해볼까요?"}
      </p>
    </div>
  );
}

function LessonCard({
  lesson,
  onWrite,
  onFeedback,
}: {
  lesson: StudentLessonCard;
  onWrite: () => void;
  onFeedback: () => void;
}) {
  const isSubmitted = Boolean(lesson.submissionId);

  return (
    <div className="flex h-full flex-col rounded-[32px] border border-gray-100 bg-white px-[29px] py-[22px] shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-woom-display text-[26px] font-black text-[#6eb88c]">
          {lesson.subject}
        </span>
        <span className="rounded-full bg-[#e2f1e7] px-[40px] py-[2px] text-[17px] font-bold text-gray-900">
          {formatDate(lesson.lessonDate)}
        </span>
      </div>

      <h3 className="font-woom-display mb-5 text-left text-[24px] font-black leading-tight text-black">
        {lesson.title}
      </h3>
      <p className="mb-10 flex-1 text-[20px] leading-tight text-black">
        {lesson.description}
      </p>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={isSubmitted ? onFeedback : onWrite}
          className={`w-4/5 max-w-[320px] rounded-full px-0 py-[8px] text-xl font-black text-white transition-all active:scale-95 ${
            isSubmitted
              ? "bg-[#4e95d9] shadow-md shadow-gray-400/30 hover:bg-[#2e80d2]"
              : "bg-[#60b384] shadow-md shadow-[#60b384]/30 hover:bg-[#52a075]"
          }`}
        >
          <span className="font-woom-display">
            {isSubmitted ? "AI 피드백 확인하기" : "움노트 작성하기"}
          </span>
        </button>
      </div>
    </div>
  );
}

function MyLearningCard({
  lesson,
  onFeedbackClick,
}: {
  lesson: StudentLessonCard;
  onFeedbackClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-[32px] border border-gray-100 bg-white px-[29px] py-[22px] shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-woom-display text-[26px] font-black text-[#6eb88c]">
          {lesson.subject}
        </span>
        <span className="rounded-full bg-[#e2f1e7] px-[40px] py-[2px] text-[17px] font-bold text-gray-900">
          {formatDate(lesson.lessonDate)}
        </span>
      </div>

      <h3 className="font-woom-display mb-4 text-left text-[24px] font-black leading-tight text-black">
        {lesson.title}
      </h3>

      <div className="mb-8 flex flex-1 flex-col justify-center rounded-[24px] bg-[#f0f4e3] px-[24px] py-[16px]">
        <div className="mb-2 flex items-baseline gap-2">
          <span className="font-woom-display text-[32px] font-black leading-none text-[#60b384]">
            {lesson.totalScore ?? "-"}
          </span>
          <span className="font-woom-display text-[20px] font-bold text-gray-600">
            / {lesson.maxScore ?? "-"}
          </span>
        </div>
        <p className="text-[20px] leading-tight text-gray-800">
          {lesson.feedbackSummary ?? "AI 피드백이 아직 준비되지 않았어요."}
        </p>
      </div>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={onFeedbackClick}
          className="w-4/5 max-w-[320px] rounded-full bg-[#4e95d9] px-0 py-[8px] text-xl font-black text-white shadow-md shadow-gray-400/30 transition-all active:scale-95 hover:bg-[#2e80d2]"
        >
          <span className="font-woom-display">AI 피드백 확인하기</span>
        </button>
      </div>
    </div>
  );
}

function PublicNoteCard({
  note,
  onViewClick,
}: {
  note: StudentPublicNoteCard;
  onViewClick: () => void;
}) {
  return (
    <div className="flex min-h-[260px] flex-col rounded-[24px] border border-gray-100 bg-white px-[24px] py-[20px] shadow-sm">
      <div className="mb-4 flex justify-between">
        <span className="rounded-full bg-[#f0f4e3] px-[16px] py-[4px] text-[16px] font-bold text-[#124223]">
          {note.studentNumber ? `${note.studentNumber}번 ` : ""}
          {note.authorName}
        </span>
      </div>

      <div className="mb-6 flex-1 overflow-hidden rounded-[20px] border border-[#e5eacc] bg-[#f7fbf8] px-[20px] py-[16px]">
        <p className="line-clamp-4 text-[18px] leading-snug text-gray-700">
          {note.content}
        </p>
      </div>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={onViewClick}
          className="w-full rounded-full bg-[#60b384] px-0 py-[6px] text-xl font-black text-white shadow-md shadow-[#60b384]/30 transition-all active:scale-95 hover:bg-[#52a075]"
        >
          <span className="font-woom-display">움노트 보기</span>
        </button>
      </div>
    </div>
  );
}

function SectionHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 mt-[16px] rounded-[32px] bg-[#bad35c] px-[40px] pb-[15px] pt-[27px] shadow-sm">
      <h2 className="font-woom-display mb-2 mt-[-4px] text-4xl font-black text-white">
        {title}
      </h2>
      <p className="text-[26px] font-bold text-black">{description}</p>
    </div>
  );
}

type DetailModalProps = {
  state: DetailState;
  onClose: () => void;
  onEditRequest: (lesson: StudentLessonCard) => void;
  writeText: string;
  writePrivacy: "public" | "private";
  imagePreviewUrl: string | null;
  onWriteTextChange: (value: string) => void;
  onWritePrivacyChange: (value: "public" | "private") => void;
  onImageSelect: (file: File | null) => void;
  onImageRemove: () => void;
  onSubmit: (lessonId: string) => void;
  isSubmitting: boolean;
  submitError: string | null;
};

function DetailModal({
  state,
  onClose,
  onEditRequest,
  writeText,
  writePrivacy,
  imagePreviewUrl,
  onWriteTextChange,
  onWritePrivacyChange,
  onImageSelect,
  onImageRemove,
  onSubmit,
  isSubmitting,
  submitError,
}: DetailModalProps) {
  if (!state) {
    return null;
  }

  if (state.kind === "feedback") {
    const lesson = state.lesson;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-xl">
          <div className="shrink-0 border-b border-[#d6e4ef] bg-[#eef3f8] px-[32px] py-[14px]">
            <div className="mb-0 flex items-start justify-between">
              <div>
                <span className="mr-3 font-woom-display text-[26px] text-[#4e95d9]">
                  {lesson.subject}
                </span>
                <span className="font-woom-display text-[26px] text-gray-900">
                  {lesson.title}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/70 p-2 text-[#38546b] transition hover:bg-white"
                aria-label="닫기"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-[20px] text-gray-800">{lesson.description}</p>
          </div>

          <div className="flex flex-col gap-8 overflow-y-auto px-[32px] py-[16px]">
            <div className="relative overflow-hidden rounded-full bg-[#b6d6ec] px-[48px] py-[16px]">
              <div className="flex items-center gap-8">
                <div className="flex w-1/4 items-baseline gap-2">
                  <span className="font-woom-display text-[56px] font-black leading-none text-[#4e95d9]">
                    {lesson.totalScore ?? "-"}
                  </span>
                  <span className="font-woom-display text-[28px] font-black text-[#121d31]">
                    / {lesson.maxScore ?? "-"}
                  </span>
                </div>
                <div className="flex-1 text-center font-woom-display text-[24px] font-black text-[#121d31]">
                  {lesson.feedbackSummary ?? "AI 피드백이 아직 준비되지 않았어요."}
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex max-h-[220px] flex-1 flex-col rounded-[24px] border border-gray-200 px-[32px] py-[8px]">
                <h3 className="font-woom-display mb-6 border-b border-gray-100 text-[28px] font-black">
                  잘한 점
                </h3>
                <ul className="space-y-4 overflow-y-auto pr-2">
                  {(lesson.feedbackStrengths.length > 0
                    ? lesson.feedbackStrengths
                    : ["잘한 점이 생성되면 이곳에 표시돼요."]).map((item) => (
                    <li key={item} className="text-[20px] text-gray-800">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex max-h-[220px] flex-1 flex-col rounded-[24px] border border-gray-200 px-[32px] py-[8px]">
                <h3 className="font-woom-display mb-6 border-b border-gray-100 text-[28px] font-black">
                  보완할 점
                </h3>
                <ul className="space-y-4 overflow-y-auto pr-2">
                  {(lesson.feedbackImprovements.length > 0
                    ? lesson.feedbackImprovements
                    : ["보완할 점이 생성되면 이곳에 표시돼요."]).map((item) => (
                    <li key={item} className="text-[20px] text-gray-800">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[20px] border border-gray-100 bg-[#f7fbf8] p-[32px]">
              <p className="mb-3 font-woom-display text-[20px] text-[#60b384]">
                내가 작성한 움노트
              </p>
              <p className="whitespace-pre-wrap text-[22px] leading-relaxed text-gray-800">
                {lesson.submissionContent ?? "작성한 내용이 아직 없어요."}
              </p>
            </div>

            {lesson.attachmentUrl ? (
              <div className="rounded-[20px] border border-gray-100 bg-[#f7fbf8] p-[20px]">
                <img
                  src={lesson.attachmentUrl}
                  alt="첨부 이미지"
                  className="max-h-[360px] w-full rounded-[16px] object-contain"
                />
              </div>
            ) : null}

            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => onEditRequest(lesson)}
                className="rounded-full bg-[#60b384] px-[80px] py-[6px] text-[26px] font-black text-white shadow-md shadow-[#60b384]/30 transition-all active:scale-95 hover:bg-[#52a075]"
              >
                <span className="font-woom-display">움노트 수정하기</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "public-note") {
    const note = state.note;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
        <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-[#e5eacc] bg-[#f0f4e3] px-[32px] py-[16px]">
            <div className="flex items-start justify-between">
              <div>
                <span className="mr-3 font-woom-display text-[26px] text-[#60b384]">
                  {note.subject}
                </span>
                <span className="font-woom-display text-[26px] text-gray-900">
                  {note.title}
                </span>
                <p className="mt-2 text-[18px] font-bold text-gray-700">
                  {note.studentNumber ? `${note.studentNumber}번 ` : ""}
                  {note.authorName} · {formatDate(note.lessonDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/70 p-2 text-[#38546b] transition hover:bg-white"
                aria-label="닫기"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto px-[32px] py-[24px]">
            <div className="rounded-[20px] border border-gray-100 bg-[#f7fbf8] p-[32px]">
              <p className="whitespace-pre-wrap text-[22px] leading-relaxed text-gray-800">
                {note.content}
              </p>
            </div>

            {note.attachmentUrl ? (
              <div className="mt-6 rounded-[20px] border border-gray-100 bg-[#f7fbf8] p-[20px]">
                <img
                  src={note.attachmentUrl}
                  alt="첨부 이미지"
                  className="max-h-[360px] w-full rounded-[16px] object-contain"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const lesson = state.lesson;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-[#e5eacc] bg-[#f0f4e3] px-[32px] py-[14px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="mr-3 font-woom-display text-[26px] text-[#60b384]">
                {lesson.subject}
              </span>
              <span className="font-woom-display text-[26px] text-gray-900">
                {lesson.title}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/70 p-2 text-[#38546b] transition hover:bg-white"
              aria-label="닫기"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-[20px] text-gray-800">{lesson.description}</p>
        </div>

        <div className="flex gap-10 overflow-y-auto px-[32px] py-[20px]">
          <div className="flex min-w-0 flex-[6] flex-col">
            <h3 className="mb-4 font-woom-display text-[24px] text-[#60b384]">
              움노트 기록하기
            </h3>
            <textarea
              value={writeText}
              onChange={(event) => onWriteTextChange(event.target.value)}
              placeholder="오늘 배운 내용을 자유롭게 적어보세요. 나만의 생각을 적어도 좋아요."
              className="min-h-[400px] w-full flex-1 resize-none rounded-[16px] border border-gray-200 px-[32px] pb-[32px] pt-[24px] text-[20px] focus:border-[#60b384] focus:outline-none focus:ring-1 focus:ring-[#60b384] placeholder:text-gray-300"
            />
          </div>

          <div className="flex min-w-[320px] max-w-[400px] flex-[4] flex-col">
            <h3 className="mb-4 font-woom-display text-[24px] text-[#60b384]">
              사진 첨부하기
            </h3>
            <label className="mb-8 flex h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[16px] border border-gray-200 bg-white transition-colors hover:bg-gray-50">
              {imagePreviewUrl ? (
                <div className="relative h-full w-full">
                  <img
                    src={imagePreviewUrl}
                    alt="업로드 미리보기"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onImageRemove();
                    }}
                    className="absolute right-3 top-3 rounded-full bg-white/85 p-2 text-gray-700 shadow-sm hover:bg-white"
                    aria-label="이미지 제거"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Camera className="mb-3 h-16 w-16 text-[#a0cbb1]" strokeWidth={1.5} />
                  <span className="text-center text-[16px] leading-tight text-[#a0cbb1]">
                    <span className="font-bold">사진을 올리거나 눌러서</span>
                    <br />
                    <span className="font-bold">이미지를 선택해보세요.</span>
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  onImageSelect(event.target.files?.[0] ?? null)
                }
              />
            </label>

            <h3 className="mb-4 font-woom-display text-[24px] text-[#60b384]">
              공개 설정
            </h3>
            <div className="mb-8 flex flex-col gap-4">
              <label className="group flex cursor-pointer items-center">
                <div
                  className={`mr-3 flex h-[24px] w-[24px] items-center justify-center rounded-full border-[2px] transition-colors ${
                    writePrivacy === "public"
                      ? "border-[#60b384]"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {writePrivacy === "public" ? (
                    <div className="h-3 w-3 rounded-full bg-[#60b384]" />
                  ) : null}
                </div>
                <input
                  type="radio"
                  name="privacy"
                  className="hidden"
                  checked={writePrivacy === "public"}
                  onChange={() => onWritePrivacyChange("public")}
                />
                <span className="text-[20px] font-bold text-gray-800">
                  친구들에게 공개하기
                </span>
              </label>

              <label className="group flex cursor-pointer items-center">
                <div
                  className={`mr-3 flex h-[24px] w-[24px] items-center justify-center rounded-full border-[2px] transition-colors ${
                    writePrivacy === "private"
                      ? "border-[#60b384]"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {writePrivacy === "private" ? (
                    <div className="h-3 w-3 rounded-full bg-[#60b384]" />
                  ) : null}
                </div>
                <input
                  type="radio"
                  name="privacy"
                  className="hidden"
                  checked={writePrivacy === "private"}
                  onChange={() => onWritePrivacyChange("private")}
                />
                <span className="text-[20px] font-bold text-gray-800">나만 보기</span>
              </label>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-[16px] border border-[#ffd7dc] bg-[#fff5f6] px-[20px] py-[14px] text-[16px] font-semibold text-[#b23b4a]">
                {submitError}
              </div>
            ) : null}

            <div className="mt-auto pt-8">
              <button
                type="button"
                disabled={isSubmitting || writeText.trim().length === 0}
                onClick={() => onSubmit(lesson.lessonId)}
                className={`w-full rounded-full px-0 py-[6px] text-[24px] font-black text-white transition-all active:scale-95 ${
                  writeText.trim().length > 0 && !isSubmitting
                    ? "bg-[#60b384] shadow-md shadow-[#60b384]/30 hover:bg-[#52a075]"
                    : "cursor-not-allowed bg-[#a3a3a3]"
                }`}
              >
                <span className="font-woom-display">
                  {isSubmitting ? "제출 중..." : "제출하기"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentDashboard({
  studentName,
  studentEmail,
  lessons,
  publicNotes,
}: StudentDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [writeText, setWriteText] = useState("");
  const [writePrivacy, setWritePrivacy] = useState<"public" | "private">("private");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const submittedLessons = lessons.filter((lesson) => lesson.submissionId);
  const todayLessons = lessons.filter((lesson) => isToday(lesson.lessonDate));
  const highlightedLessons = todayLessons.length > 0 ? todayLessons : lessons;
  const groupedPublicNotes = getGroupedPublicNotes(publicNotes);
  const classroomTitle = lessons[0]?.classroomTitle;

  function openWriteModal(lesson: StudentLessonCard) {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setWriteText(lesson.submissionContent ?? "");
    setWritePrivacy(lesson.isPublic ? "public" : "private");
    setSelectedImageFile(null);
    setImagePreviewUrl(lesson.attachmentUrl ?? null);
    setRemoveAttachment(false);
    setSubmitError(null);
    setDetailState({ kind: "write", lesson });
  }

  function closeDetailModal() {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setRemoveAttachment(false);
    setDetailState(null);
  }

  function handleImageSelect(file: File | null) {
    if (!file) {
      return;
    }

    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setRemoveAttachment(false);
  }

  function handleImageRemove() {
    if (imagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setRemoveAttachment(true);
  }

  async function handleSubmit(lessonId: string) {
    setSubmitError(null);

    const formData = new FormData();
    formData.append("lessonId", lessonId);
    formData.append("content", writeText);
    formData.append("isPublic", String(writePrivacy === "public"));
    formData.append("removeAttachment", String(removeAttachment));

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    }

    const response = await fetch("/api/student/submissions", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as { message?: string };

    if (!response.ok) {
      setSubmitError(result.message ?? "제출에 실패했습니다.");
      return;
    }

    closeDetailModal();

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#f7fbf8]">
      <header className="h-[80px] shrink-0 border-b border-gray-100 bg-white px-8 shadow-sm">
        <div className="mx-auto flex h-full max-w-[1440px] items-center">
          <div className="flex flex-col items-center justify-center pt-2">
            <h1
              className="font-woom-display text-[40px] font-black tracking-tight text-[#6eb88c]"
              style={{ textShadow: "1px 1px 0 #fff, 2px 2px 0 #ccc" }}
            >
              움노트
            </h1>
          </div>
          <div className="ml-auto rounded-full bg-[#eef4ed] px-4 py-2 text-[18px] text-[#466151]">
            <span className="font-woom-display">{studentEmail}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[260px] shrink-0 bg-[#e7f1e9] p-6">
          <div className="flex flex-col gap-5">
            {tabs.map((tab) => (
              <SidebarButton
                key={tab.key}
                active={activeTab === tab.key}
                label={tab.label}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto px-[40px] py-[10px]">
          {activeTab === "home" ? (
            <div className="mx-auto flex max-w-[1200px] flex-col pb-[20px]">
              <WelcomeCard
                studentName={studentName}
                classroomTitle={classroomTitle}
              />

              {highlightedLessons.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[24px] text-[#a0aeab]">
                  아직 표시할 수업이 없어요.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {highlightedLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.lessonId}
                      lesson={lesson}
                      onWrite={() => openWriteModal(lesson)}
                      onFeedback={() => setDetailState({ kind: "feedback", lesson })}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "my-learning" ? (
            <div className="mx-auto flex max-w-[1200px] flex-col pb-[20px]">
              <SectionHero
                title="나의 움노트"
                description="내가 작성한 움노트를 모아보고 AI 피드백을 다시 확인할 수 있어요."
              />

              {submittedLessons.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[24px] text-[#a0aeab]">
                  아직 제출한 움노트가 없어요.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {submittedLessons.map((lesson) => (
                    <MyLearningCard
                      key={lesson.lessonId}
                      lesson={lesson}
                      onFeedbackClick={() =>
                        setDetailState({ kind: "feedback", lesson })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "class-learning" ? (
            <div className="mx-auto flex max-w-[1200px] flex-col pb-[20px]">
              <SectionHero
                title="학급 공개노트"
                description="친구들이 공개한 움노트를 함께 볼 수 있어요."
              />

              {groupedPublicNotes.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[24px] text-[#a0aeab]">
                  아직 공개된 움노트가 없어요.
                </div>
              ) : (
                <div className="flex flex-col gap-10">
                  {groupedPublicNotes.map((group) => (
                    <div key={group.key} className="flex flex-col">
                      <div className="mb-[20px] flex items-center border-b-[2px] border-[#e5eacc] pb-[12px]">
                        <span className="mr-3 font-woom-display text-[26px] font-black text-[#6eb88c]">
                          {group.subject}
                        </span>
                        <span className="mr-auto font-woom-display text-[24px] font-black text-gray-900">
                          {group.title}
                        </span>
                        <span className="rounded-full bg-[#e2f1e7] px-[24px] py-[4px] text-[16px] font-bold text-gray-900">
                          {formatDate(group.lessonDate)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {group.notes.map((note) => (
                          <PublicNoteCard
                            key={note.submissionId}
                            note={note}
                            onViewClick={() =>
                              setDetailState({ kind: "public-note", note })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      <DetailModal
        state={detailState}
        onClose={closeDetailModal}
        onEditRequest={openWriteModal}
        writeText={writeText}
        writePrivacy={writePrivacy}
        imagePreviewUrl={imagePreviewUrl}
        onWriteTextChange={setWriteText}
        onWritePrivacyChange={setWritePrivacy}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
}
