import nodemailer from "nodemailer";

export function getMailTransport() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendAppMail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getMailTransport();

  if (!transport || !process.env.SMTP_FROM) {
    throw new Error("SMTP 환경 변수가 아직 설정되지 않았습니다.");
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
