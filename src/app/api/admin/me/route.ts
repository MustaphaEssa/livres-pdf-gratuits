import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    admin: {
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
