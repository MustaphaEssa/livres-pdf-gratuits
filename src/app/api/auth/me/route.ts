import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/user-server";

export const runtime = "nodejs";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { email: session.email, name: session.name },
  });
}
