import OpenAI from "openai";

export type GeneratedFeedback = {
  totalScore: number;
  maxScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  modelName: string;
};

type GenerateFeedbackInput = {
  subject: string;
  title: string;
  description: string;
  content: string;
  maxScore: number;
  attachmentUrl?: string | null;
};

type FeedbackResponse = {
  totalScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
};

const defaultModel = process.env.OPENAI_MODEL || "gpt-5.2";

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function buildFallbackFeedback(
  content: string,
  maxScore: number,
): GeneratedFeedback {
  const trimmed = content.trim();
  const sentenceCount = trimmed
    .split(/[.!?]\s+|\n+/)
    .map((item) => item.trim())
    .filter(Boolean).length;

  const lengthScore = Math.min(maxScore, Math.max(1, Math.floor(trimmed.length / 35)));
  const structureBonus = sentenceCount >= 2 ? 1 : 0;
  const totalScore = Math.min(
    maxScore,
    Math.max(Math.ceil(maxScore * 0.65), lengthScore + structureBonus),
  );

  const strengths = [
    trimmed.length >= 60
      ? "배운 내용을 자기 말로 비교적 자세히 정리했어요."
      : "핵심 내용을 간단명료하게 정리했어요.",
    sentenceCount >= 2
      ? "문장을 나누어 생각의 흐름이 잘 보이게 썼어요."
      : "짧은 문장으로도 핵심을 전달하려는 시도가 보여요.",
  ];

  const improvements = [
    "수업에서 떠오른 장면이나 예시를 한 가지 더 적어보면 더 좋아요.",
    "마지막 문장에 내가 새롭게 알게 된 점을 덧붙이면 글이 더 또렷해져요.",
  ];

  return {
    totalScore,
    maxScore,
    summary:
      totalScore >= maxScore - 1
        ? "핵심 내용과 자신의 생각이 잘 드러난 움노트예요."
        : "배운 내용을 잘 정리했고, 조금만 더 구체적으로 쓰면 더 좋아질 수 있어요.",
    strengths,
    improvements,
    modelName: "woomnote-rule-feedback-v1",
  };
}

function isFeedbackResponse(value: unknown): value is FeedbackResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.totalScore === "number" &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.strengths) &&
    candidate.strengths.every((item) => typeof item === "string") &&
    Array.isArray(candidate.improvements) &&
    candidate.improvements.every((item) => typeof item === "string")
  );
}

export async function generateFeedbackWithOpenAI(
  input: GenerateFeedbackInput,
): Promise<GeneratedFeedback | null> {
  const client = getClient();

  if (!client) {
    return null;
  }

  const userContent: Array<
    | {
        type: "input_text";
        text: string;
      }
    | {
        type: "input_image";
        image_url: string;
        detail: "auto";
      }
  > = [
    {
      type: "input_text",
      text: [
        `과목: ${input.subject}`,
        `수업 주제: ${input.title}`,
        `수업 설명: ${input.description}`,
        `학생 작성 내용: ${input.content}`,
        `총점: ${input.maxScore}`,
        "학생에게 보여줄 짧고 따뜻한 한국어 피드백을 만들어줘.",
      ].join("\n"),
    },
  ];

  if (input.attachmentUrl) {
    userContent.push({
      type: "input_image",
      image_url: input.attachmentUrl,
      detail: "auto",
    });
  }

  try {
    const response = await client.responses.create({
      model: defaultModel,
      input: [
        {
          role: "system",
          content:
            "You are an elementary classroom feedback assistant. Respond in Korean. Be warm, short, and teacher-friendly.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "woomnote_feedback",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              totalScore: {
                type: "integer",
              },
              summary: {
                type: "string",
              },
              strengths: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              improvements: {
                type: "array",
                items: {
                  type: "string",
                },
              },
            },
            required: ["totalScore", "summary", "strengths", "improvements"],
          },
        },
      },
    });

    const text = response.output_text;
    const parsed = JSON.parse(text) as unknown;

    if (!isFeedbackResponse(parsed)) {
      return null;
    }

    return {
      totalScore: Math.max(0, Math.min(input.maxScore, parsed.totalScore)),
      maxScore: input.maxScore,
      summary: parsed.summary,
      strengths: parsed.strengths.slice(0, 3),
      improvements: parsed.improvements.slice(0, 3),
      modelName: response.model,
    };
  } catch (error) {
    console.error("OpenAI feedback generation failed:", error);
    return null;
  }
}
