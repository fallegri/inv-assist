import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    // Load user record
    const result = await query(`SELECT id, nombre, email, password_hash FROM user_profiles WHERE email = $1`, [email]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Correo o contraseña incorrecta" }, { status: 401 });
    }

    const user = result.rows[0];

    // Verify Password Against Hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Correo o contraseña incorrecta" }, { status: 401 });
    }

     // Generate JSON Web Token
    const token = signToken({ id: user.id, email: user.email, nombre: user.nombre });

    // Enviar Coookie
    const cookieStore = await cookies();
     cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana // Expires in 1 Week
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, nombre: user.nombre } });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
