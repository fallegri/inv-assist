import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { uid, nombre, institucion, carrera, area_estudio } = await req.json();

    if (!uid || !nombre || !institucion || !carrera) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Save user profile in Postgres
    await query(
      `INSERT INTO user_profiles (id, nombre, institucion, carrera, area_estudio)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE 
       SET nombre = EXCLUDED.nombre,
           institucion = EXCLUDED.institucion,
           carrera = EXCLUDED.carrera,
           area_estudio = EXCLUDED.area_estudio;`,
      [uid, nombre, institucion, carrera, area_estudio]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving user profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
