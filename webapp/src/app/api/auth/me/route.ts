import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = verifyToken(token) as any;
    
    if (!decoded || !decoded.id) {
      // Token exists but format / expiry is dead
      cookieStore.delete("auth_token");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: { id: decoded.id, email: decoded.email, nombre: decoded.nombre } });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
