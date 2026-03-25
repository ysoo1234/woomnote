"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type {
  TeacherLessonOverview,
  TeacherStudentNote,
} from "@/lib/queries/dashboard";

type TeacherDashboardProps = {
  teacherName: string;
  teacherEmail: string;
  lessons: TeacherLessonOverview[];
  notes: TeacherStudentNote[];
};

type TabKey = "class" | "students" | "classroom";

type DetailState =
  | {
      kind: "note";
      note: TeacherStudentNote;
    }
  | null;

type TeacherCreateFormState = {
  subject: string;
  lessonDate: string;
  title: string;
  description: string;
};

type StudentSummary = {
  studentUserId: string;
  studentName: string;
  studentNumber: number | null;
};

type PublicGroup = {
  key: string;
  subject: string;
  title: string;
  lessonDate: string;
  notes: TeacherStudentNote[];
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${Number(month)}월 ${Number(day)}일`;
}

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getStudents(notes: TeacherStudentNote[]): StudentSummary[] {
  const map = new Map<string, StudentSummary>();

  for (const note of notes) {
    if (!map.has(note.studentUserId)) {
      map.set(note.studentUserId, {
        studentUserId: note.studentUserId,
        studentName: note.studentName,
        studentNumber: note.studentNumber,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.studentNumber === null) return 1;
    if (b.studentNumber === null) return -1;
    return a.studentNumber - b.studentNumber;
  });
}

function getPublicGroups(notes: TeacherStudentNote[]): PublicGroup[] {
  const groups = new Map<string, TeacherStudentNote[]>();

  for (const note of notes) {
    if (!note.isPublic) {
      continue;
    }

    const key = `${note.subject}|${note.title}|${note.lessonDate}`;
    const current = groups.get(key) ?? [];
    current.push(note);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([key, groupNotes]) => ({
    key,
    subject: groupNotes[0].subject,
    title: groupNotes[0].title,
    lessonDate: groupNotes[0].lessonDate,
    notes: groupNotes,
  }));
}

function Logo() {
  return (
    <div className="flex flex-col items-center justify-center pt-2">
      <h1
        className="font-woom-display text-[40px] font-black tracking-tight text-[#6eb88c]"
        style={{ textShadow: "1px 1px 0 #fff, 2px 2px 0 #d4d4d4" }}
      >
        움노트
      </h1>
    </div>
  );
}

function NavItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full rounded-full px-6 py-2 text-[24px] font-normal transition-all ${
        active
          ? "bg-[#add1bc] text-[#124223] shadow-sm before:absolute before:left-[18px] before:top-1/2 before:h-[26px] before:w-[5px] before:-translate-y-1/2 before:rounded-full before:bg-[#60b384]"
          : "bg-white/60 text-[#a0aeab] shadow-sm hover:bg-white hover:text-[#768981]"
      } font-woom-display`}
    >
      <span className={active ? "relative z-10" : ""}>{children}</span>
    </button>
  );
}

function TeacherWelcomeCard({
  teacherName,
  onCreateClick,
}: {
  teacherName: string;
  onCreateClick: () => void;
}) {
  return (
    <div className="mx-0 mb-8 mt-0 flex items-center justify-between rounded-[32px] bg-[#6eb88c] px-[40px] pb-[15px] pt-[27px] shadow-sm">
      <div>
        <h2 className="font-woom-display mb-2 mt-[-4px] text-4xl font-black text-white">
          {teacherName} 선생님의 수업을 확인해보세요
        </h2>
        <p className="text-[26px] font-bold text-black">
          오늘 수업과 학생 제출 현황을 볼 수 있어요.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateClick}
        className="flex items-center gap-2 rounded-full bg-white px-[28px] py-[14px] text-[22px] text-[#499066] shadow-md transition-all active:scale-95 hover:bg-[#f6fbf7]"
      >
        <span className="pb-[2px] text-[26px] font-black leading-none">+</span>
        <span className="font-woom-display">수업 만들기</span>
      </button>
    </div>
  );
}

function TeacherClassCard({
  lesson,
  onOpenStudents,
}: {
  lesson: TeacherLessonOverview;
  onOpenStudents: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-[32px] border border-gray-100 bg-white p-[24px] shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <span className="font-woom-display text-[26px] font-black text-[#6eb88c]">
          {lesson.subject}
        </span>
        <span className="rounded-full bg-[#e2f1e7] px-[24px] py-[2px] text-[16px] font-bold text-gray-900">
          {formatDate(lesson.lessonDate)}
        </span>
      </div>

      <h3 className="font-woom-display mb-5 text-left text-[24px] font-black leading-tight text-black">
        {lesson.title}
      </h3>

      <div className="mb-8 flex flex-1 flex-col justify-center rounded-[24px] border border-[#e5eacc] bg-[#f7fbf8] px-[24px] py-[16px]">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-woom-display text-[22px] text-gray-700">제출 현황</span>
          <div className="flex items-baseline gap-1">
            <span className="font-woom-display text-[28px] font-black leading-none text-[#60b384]">
              {lesson.submissionCount}
            </span>
            <span className="font-woom-display text-[20px] font-bold text-gray-500">
              / {lesson.studentCount}명
            </span>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#60b384] transition-all duration-500"
            style={{
              width: `${
                lesson.studentCount > 0
                  ? (lesson.submissionCount / lesson.studentCount) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={onOpenStudents}
          className="w-4/5 max-w-[320px] rounded-full bg-[#60b384] px-0 py-[8px] text-xl font-black text-white shadow-md shadow-[#60b384]/30 transition-all active:scale-95 hover:bg-[#52a075]"
        >
          <span className="font-woom-display">학생별 보기</span>
        </button>
      </div>
    </div>
  );
}

function NoteDetail({
  note,
  onBack,
}: {
  note: TeacherStudentNote;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-[40px] py-[32px]">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[20px] font-bold text-gray-500 transition-colors hover:text-[#6eb88c]"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-woom-display">목록으로 돌아가기</span>
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="font-woom-display text-[28px] font-black text-[#6eb88c]">
            {note.subject}
          </span>
          <span className="rounded-full bg-gray-100 px-[16px] py-[4px] text-[16px] font-bold text-gray-600">
            {formatDate(note.lessonDate)}
          </span>
          <span className="rounded-full bg-[#e7f1e9] px-[16px] py-[4px] text-[16px] font-bold text-[#124223]">
            {note.studentNumber ? `${note.studentNumber}번 ` : ""}
            {note.studentName}
          </span>
        </div>
        <h2 className="font-woom-display text-[32px] font-black leading-tight text-gray-900">
          {note.title}
        </h2>
      </div>

      <div className="mb-8 flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="min-h-[220px] rounded-[24px] border border-[#e5eacc] bg-[#f7fbf8] p-[32px] text-[20px] leading-relaxed text-gray-800">
            {note.content || "작성된 움노트 내용이 없습니다."}
          </div>

          {note.attachmentUrl ? (
            <div className="mt-6 rounded-[24px] border border-[#e5eacc] bg-[#f7fbf8] p-[20px]">
              <img
                src={note.attachmentUrl}
                alt="첨부 이미지"
                className="max-h-[360px] w-full rounded-[16px] object-contain"
              />
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-[360px] rounded-[24px] border border-[#b2d9c1] bg-[#eaf4ed] p-[24px]">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-woom-display text-[24px] font-black text-[#2c6b48]">
              AI 피드백
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-woom-display text-[32px] font-black leading-none text-[#60b384]">
                {note.totalScore ?? "-"}
              </span>
              <span className="font-woom-display text-[20px] font-bold text-gray-500">
                / {note.maxScore ?? "-"}
              </span>
            </div>
          </div>

          <p className="rounded-2xl border border-white bg-white/70 p-4 text-[18px] leading-relaxed text-gray-800">
            {note.feedbackSummary ?? "AI 피드백이 아직 준비되지 않았습니다."}
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div>
              <span className="inline-block rounded-full bg-[#4a936a] px-4 py-1.5 text-[14px] font-bold text-white">
                잘한 점
              </span>
              <div className="mt-3 rounded-2xl border border-white bg-white/60 p-4 text-[16px] leading-relaxed text-gray-800">
                {(note.feedbackStrengths.length > 0
                  ? note.feedbackStrengths
                  : ["학생의 강점 피드백이 생성되면 이 영역에 표시됩니다."]).map(
                  (item) => (
                    <p key={item}>- {item}</p>
                  ),
                )}
              </div>
            </div>

            <div>
              <span className="inline-block rounded-full bg-[#d3475a] px-4 py-1.5 text-[14px] font-bold text-white">
                보완할 점
              </span>
              <div className="mt-3 rounded-2xl border border-white bg-white/60 p-4 text-[16px] leading-relaxed text-gray-800">
                {(note.feedbackImprovements.length > 0
                  ? note.feedbackImprovements
                  : ["보완 피드백이 생성되면 이 영역에 표시됩니다."]).map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherLessonCreateForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherCreateFormState>({
    subject: "",
    lessonDate: getTodayDate(),
    title: "",
    description: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const response = await fetch("/api/teacher/lessons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        allowPublicFeed: true,
      }),
    });

    const result = (await response.json()) as { message?: string };

    if (!response.ok) {
      setErrorMessage(result.message ?? "수업 생성에 실패했습니다.");
      return;
    }

    startTransition(() => {
      router.refresh();
      onCreated();
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white p-[40px] shadow-sm">
      <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[20px] font-bold text-gray-500 transition-colors hover:text-[#6eb88c]"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-woom-display">목록으로 돌아가기</span>
        </button>
        <span className="font-woom-display text-[28px] font-black text-[#6eb88c]">
          새로운 수업
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 overflow-y-auto pb-4"
      >
        <section className="flex flex-col gap-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-[6px] rounded-full bg-[#6eb88c]" />
            <h3 className="font-woom-display text-[24px] text-gray-800">
              학생에게 보여지는 기본 정보
            </h3>
          </div>

          <div className="flex flex-col gap-6 rounded-[24px] border border-[#e5eacc] bg-[#f7fbf8] p-[32px]">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <label className="font-woom-display text-[20px] text-gray-700">
                  과목
                </label>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  type="text"
                  placeholder="예: 국어"
                  className="h-[46px] rounded-[16px] border border-[#e5eacc] bg-white px-[20px] py-[8px] text-[18px] font-bold text-gray-800 focus:border-[#6eb88c] focus:outline-none focus:ring-2 focus:ring-[#6eb88c]/20"
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="font-woom-display text-[20px] text-gray-700">
                  날짜
                </label>
                <input
                  value={form.lessonDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lessonDate: event.target.value,
                    }))
                  }
                  type="date"
                  className="h-[46px] rounded-[16px] border border-[#e5eacc] bg-white px-[20px] py-[8px] text-[18px] font-bold text-gray-800 focus:border-[#6eb88c] focus:outline-none focus:ring-2 focus:ring-[#6eb88c]/20"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-woom-display text-[20px] text-gray-700">
                수업 주제
              </label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                type="text"
                placeholder="학생에게 보여줄 주제를 적어주세요."
                className="rounded-[16px] border border-[#e5eacc] bg-white px-[20px] py-[12px] text-[18px] font-bold text-gray-800 focus:border-[#6eb88c] focus:outline-none focus:ring-2 focus:ring-[#6eb88c]/20"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="font-woom-display text-[20px] text-gray-700">
                수업 설명
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="학생들이 어떤 내용을 쓰면 좋을지 간단히 안내해주세요."
                className="resize-none rounded-[16px] border border-[#e5eacc] bg-white px-[20px] py-[12px] text-[18px] font-bold text-gray-800 focus:border-[#6eb88c] focus:outline-none focus:ring-2 focus:ring-[#6eb88c]/20"
              />
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-[20px] border border-[#ffd7dc] bg-[#fff5f6] px-5 py-4 text-[16px] font-semibold text-[#b23b4a]">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-center border-t border-gray-100 pt-8">
          <button
            type="submit"
            disabled={isPending}
            className="w-[320px] rounded-full bg-[#6eb88c] px-0 py-[8px] text-[26px] font-black text-white shadow-md shadow-[#6eb88c]/30 transition-all active:scale-95 hover:bg-[#60b384] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="font-woom-display">
              {isPending ? "수업 생성 중..." : "수업 생성하기"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function TeacherStudentsTab({
  notes,
}: {
  notes: TeacherStudentNote[];
}) {
  const students = useMemo(() => getStudents(notes), [notes]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.studentUserId ?? null,
  );
  const [detailState, setDetailState] = useState<DetailState>(null);

  const studentNotes = selectedStudentId
    ? notes.filter((note) => note.studentUserId === selectedStudentId)
    : [];

  return (
    <div className="relative flex h-full w-full max-w-[1400px] gap-6 overflow-hidden pb-4">
      <div className="flex h-full w-[220px] shrink-0 flex-col gap-4 overflow-hidden pr-2">
        <div className="shrink-0 rounded-[24px] bg-[#6eb88c] p-[24px] text-white shadow-sm">
          <h2 className="font-woom-display mb-1 text-[28px] font-black">
            학생별 움노트
          </h2>
          <p className="text-[18px] font-bold text-black">학생을 선택해보세요.</p>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
          {students.map((student) => (
            <button
              key={student.studentUserId}
              type="button"
              onClick={() => {
                setSelectedStudentId(student.studentUserId);
                setDetailState(null);
              }}
              className={`flex items-center justify-between rounded-[24px] border px-[28px] py-[20px] shadow-sm transition-all ${
                selectedStudentId === student.studentUserId
                  ? "border-[#6eb88c] bg-[#6eb88c] text-white"
                  : "border-gray-100 bg-white text-gray-800 hover:bg-[#f0f4e3]"
              }`}
            >
              <span
                className={`font-woom-display text-[16px] ${
                  selectedStudentId === student.studentUserId
                    ? "text-white/90"
                    : "text-[#6eb88c]"
                }`}
              >
                학생
              </span>
              <span className="font-woom-display text-[24px]">
                {student.studentNumber ? `${student.studentNumber}번` : student.studentName}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
        {!selectedStudentId ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-[26px] text-[#a0aeab]">
              학생을 선택하면 움노트를 확인할 수 있어요.
            </div>
          </div>
        ) : detailState?.kind === "note" ? (
          <NoteDetail
            note={detailState.note}
            onBack={() => setDetailState(null)}
          />
        ) : (
          <div className="flex h-full flex-col px-[32px] py-[16px]">
            <div className="flex-1 overflow-y-auto pr-2">
              {studentNotes.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-[24px] text-[#a0aeab]">
                  작성된 움노트가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {studentNotes.map((note) => (
                    <div
                      key={note.submissionId}
                      className="flex flex-col rounded-[28px] border border-[#e5eacc] bg-[#f7fbf8] p-[24px] shadow-sm"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="font-woom-display text-[24px] font-black text-[#6eb88c]">
                          {note.subject}
                        </span>
                        <span className="rounded-full border border-gray-100 bg-white px-[20px] py-[4px] text-[16px] font-bold text-gray-900">
                          {formatDate(note.lessonDate)}
                        </span>
                      </div>
                      <h3 className="font-woom-display text-[22px] font-black leading-tight text-black">
                        {note.title}
                      </h3>

                      <div className="mt-4 flex-1 rounded-[20px] border border-gray-100 bg-white px-[20px] py-[16px]">
                        <div className="flex items-end gap-2">
                          <span className="font-woom-display text-[28px] font-black leading-none text-[#60b384]">
                            {note.totalScore ?? "-"}
                          </span>
                          <span className="text-[18px] font-bold text-gray-500">
                            / {note.maxScore ?? "-"}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-3 text-[18px] leading-relaxed text-gray-700">
                          {note.content || "작성된 움노트 내용이 없습니다."}
                        </p>

                        {note.attachmentUrl ? (
                          <div className="mt-4 overflow-hidden rounded-[16px] border border-[#e5eacc] bg-[#f7fbf8]">
                            <img
                              src={note.attachmentUrl}
                              alt="첨부 이미지"
                              className="h-[160px] w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setDetailState({ kind: "note", note })}
                          className="w-full rounded-full bg-[#6eb88c] py-[8px] text-[20px] font-black text-white shadow-md shadow-[#6eb88c]/30 transition-all active:scale-95 hover:bg-[#60b384]"
                        >
                          <span className="font-woom-display">움노트 보기</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherClassroomTab({
  notes,
}: {
  notes: TeacherStudentNote[];
}) {
  const publicGroups = useMemo(() => getPublicGroups(notes), [notes]);
  const [detailState, setDetailState] = useState<DetailState>(null);

  return (
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col pb-4">
      <div className="mb-8 rounded-[32px] bg-[#6eb88c] px-[40px] pb-[15px] pt-[27px] shadow-sm">
        <h2 className="font-woom-display mb-2 mt-[-4px] text-4xl font-black text-white">
          학급 공개노트
        </h2>
        <p className="text-[26px] font-bold text-black">
          학생들이 공개한 움노트를 수업별로 볼 수 있어요.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {publicGroups.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-[24px] text-[#a0aeab]">
            아직 공개된 움노트가 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {publicGroups.map((group) => (
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
                    <div
                      key={note.submissionId}
                      className="flex min-h-[260px] flex-col rounded-[24px] border border-gray-100 bg-white px-[24px] py-[20px] shadow-sm"
                    >
                      <div className="mb-4 flex justify-between">
                        <span className="rounded-full bg-[#f0f4e3] px-[16px] py-[4px] text-[16px] font-bold text-[#124223]">
                          {note.studentNumber ? `${note.studentNumber}번 ` : ""}
                          {note.studentName}
                        </span>
                      </div>

                      <div className="mb-6 flex-1 overflow-hidden rounded-[20px] border border-[#e5eacc] bg-[#f7fbf8] px-[20px] py-[16px]">
                        <p className="line-clamp-4 text-[18px] leading-snug text-gray-700">
                          {note.content}
                        </p>

                        {note.attachmentUrl ? (
                          <div className="mt-4 overflow-hidden rounded-[16px] border border-[#e5eacc] bg-white">
                            <img
                              src={note.attachmentUrl}
                              alt="첨부 이미지"
                              className="h-[160px] w-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-auto flex justify-center">
                        <button
                          type="button"
                          onClick={() => setDetailState({ kind: "note", note })}
                          className="w-full rounded-full bg-[#60b384] px-0 py-[6px] text-xl font-black text-white shadow-md shadow-[#60b384]/30 transition-all active:scale-95 hover:bg-[#52a075]"
                        >
                          <span className="font-woom-display">움노트 보기</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailState?.kind === "note" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_30px_90px_rgba(29,45,31,0.2)]">
            <NoteDetail
              note={detailState.note}
              onBack={() => setDetailState(null)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeacherDashboard({
  teacherName,
  teacherEmail,
  lessons,
  notes,
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("class");
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f7fbf8]">
      <header className="relative z-10 flex h-[80px] shrink-0 items-center border-b border-gray-100 bg-white px-8 shadow-sm">
        <Logo />
        <div className="ml-auto flex items-center">
          <span className="rounded-full bg-[#e7f1e9] px-4 py-2 text-[18px] text-[#6eb88c]">
            <span className="font-woom-display">교사 대시보드 · {teacherEmail}</span>
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[260px] shrink-0 flex-col gap-5 border-r border-gray-100/50 bg-[#e7f1e9] p-6">
          <NavItem
            active={activeTab === "class"}
            onClick={() => {
              setActiveTab("class");
            }}
          >
            수업 관리
          </NavItem>
          <NavItem
            active={activeTab === "students"}
            onClick={() => {
              setActiveTab("students");
              setIsCreatingLesson(false);
            }}
          >
            학생별 움노트
          </NavItem>
          <NavItem
            active={activeTab === "classroom"}
            onClick={() => {
              setActiveTab("classroom");
              setIsCreatingLesson(false);
            }}
          >
            학급 공개노트
          </NavItem>
        </aside>

        <main className="relative flex flex-1 flex-col overflow-hidden px-[40px] py-[24px]">
          {activeTab === "class" ? (
            <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col overflow-hidden pb-[20px]">
              {isCreatingLesson ? (
                <TeacherLessonCreateForm
                  onBack={() => setIsCreatingLesson(false)}
                  onCreated={() => setIsCreatingLesson(false)}
                />
              ) : (
                <>
                  <TeacherWelcomeCard
                    teacherName={teacherName}
                    onCreateClick={() => setIsCreatingLesson(true)}
                  />

                  <div className="grid grid-cols-1 gap-8 overflow-y-auto pb-4 pr-2 pt-2 md:grid-cols-2 lg:grid-cols-3">
                    {lessons.map((lesson) => (
                      <TeacherClassCard
                        key={lesson.lessonId}
                        lesson={lesson}
                        onOpenStudents={() => {
                          setActiveTab("students");
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {activeTab === "students" ? <TeacherStudentsTab notes={notes} /> : null}
          {activeTab === "classroom" ? <TeacherClassroomTab notes={notes} /> : null}
        </main>
      </div>
    </div>
  );
}
