import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export async function GET() {
  const result = await checkDatabaseConnection();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 500,
  });
}
