import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password, nombre, institucion, carrera, area_estudio } = await req.json();

    if (!email || !password || !nombre || !institucion || !carrera) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Check if user exists
    const existing = await query(`SELECT id FROM user_profiles WHERE email = $1`, [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: "El correo ya está en uso." }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Guardar usuario
    const insertResult = await query(
      `INSERT INTO user_profiles (email, password_hash, nombre, institucion, carrera, area_estudio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [email, hash, nombre, institucion, carrera, area_estudio]
    );

    const user = insertResult.rows[0];

    // Crear sesión (JWT)
    const token = signToken({ id: user.id, email, nombre });

    // Enviar Coookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, email, nombre } }, { status: 201 });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
