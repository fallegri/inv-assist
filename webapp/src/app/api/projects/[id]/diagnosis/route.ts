import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, problem } = await req.json();

    if (!id || !context || !problem) {
      return NextResponse.json({ error: "Faltan datos requeridos (id, context, problem)" }, { status: 400 });
    }

    // Primero verificar si ya existe un registro para este proyecto
    const existing = await query(
      `SELECT id FROM evidence WHERE project_id = $1`,
      [id]
    );

    let result;
    if (existing.rowCount && existing.rowCount > 0) {
      // Actualizar el registro existente
      result = await query(
        `UPDATE evidence 
         SET contenido_raw = $2, problema_central = $3, problema_confirmado = true
         WHERE project_id = $1
         RETURNING *`,
        [id, context, problem]
      );
    } else {
      // Crear un nuevo registro
      result = await query(
        `INSERT INTO evidence (project_id, tipo_evidencia, contenido_raw, problema_central, problema_confirmado)
         VALUES ($1, 'text', $2, $3, true)
         RETURNING *`,
        [id, context, problem]
      );
    }

    return NextResponse.json({ success: true, evidence: result.rows[0] });
  } catch (error: any) {
    console.error("Save Diagnosis Error:", error?.message || error);
    return NextResponse.json({ 
      error: "Error al guardar diagnóstico: " + (error?.message || "Desconocido") 
    }, { status: 500 });
  }
}
