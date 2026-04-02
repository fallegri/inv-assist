import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { tipo, verbo, descripcion, orden } = await req.json();

    if (!id || !tipo || !verbo || !descripcion) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Si ya existe un objetivo del mismo tipo, actualizarlo
    const existing = await query(
      `SELECT id FROM objectives WHERE project_id = $1 AND tipo = $2`,
      [id, tipo]
    );

    let result;
    if (existing.rowCount && existing.rowCount > 0) {
      result = await query(
        `UPDATE objectives SET verbo = $1, descripcion = $2, orden = $3
         WHERE project_id = $4 AND tipo = $5
         RETURNING *`,
        [verbo, descripcion, orden || 1, id, tipo]
      );
    } else {
      result = await query(
        `INSERT INTO objectives (project_id, tipo, verbo, descripcion, orden, bloom_validado)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [id, tipo, verbo, descripcion, orden || 1]
      );
    }

    return NextResponse.json({ success: true, objective: result.rows[0] });
  } catch (error: any) {
    console.error("Save Objective Error:", error?.message || error);
    return NextResponse.json({ 
      error: "Error al guardar objetivo: " + (error?.message || "Desconocido") 
    }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT * FROM objectives WHERE project_id = $1 ORDER BY tipo DESC, orden ASC`,
      [id]
    );
    return NextResponse.json({ success: true, objectives: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al obtener objetivos" }, { status: 500 });
  }
}
