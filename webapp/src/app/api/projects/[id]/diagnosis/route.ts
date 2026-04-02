import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const body = await req.json();
    const { context, problem } = body;

    // Validación explícita con mensajes detallados
    if (!id) return NextResponse.json({ error: "Falta el project ID en la URL" }, { status: 400 });
    if (!context) return NextResponse.json({ error: "Falta el campo 'context'" }, { status: 400 });
    if (!problem) return NextResponse.json({ error: "Falta el campo 'problem'" }, { status: 400 });

    // Verificar que el proyecto existe
    const projectCheck = await query(`SELECT id, status FROM projects WHERE id = $1`, [id]);
    if (!projectCheck.rowCount || projectCheck.rowCount === 0) {
      return NextResponse.json({ 
        error: `Proyecto '${id}' no encontrado en la base de datos` 
      }, { status: 404 });
    }

    // Verificar si ya existe evidencia para este proyecto
    const existing = await query(`SELECT id FROM evidence WHERE project_id = $1`, [id]);

    let result;
    if (existing.rowCount && existing.rowCount > 0) {
      result = await query(
        `UPDATE evidence 
         SET contenido_raw = $2, problema_central = $3, problema_confirmado = true
         WHERE project_id = $1
         RETURNING id`,
        [id, context, problem]
      );
    } else {
      result = await query(
        `INSERT INTO evidence (project_id, tipo_evidencia, contenido_raw, problema_central, problema_confirmado)
         VALUES ($1, 'text', $2, $3, true)
         RETURNING id`,
        [id, context, problem]
      );
    }

    return NextResponse.json({ 
      success: true, 
      evidenceId: result.rows[0]?.id,
      projectStatus: projectCheck.rows[0]?.status
    });

  } catch (error: any) {
    // Retornar el error SQL completo para debugging
    const errorDetails = {
      message: error?.message || "Error desconocido",
      code: error?.code,          // Código de error PostgreSQL (ej: 42P01 = table not found)
      detail: error?.detail,      // Detalle adicional de PG
      constraint: error?.constraint, // Nombre del constraint violado
      table: error?.table,        // Tabla que causó el error
    };
    console.error("Save Diagnosis Error:", errorDetails);
    return NextResponse.json({ 
      error: "Error de base de datos",
      details: errorDetails
    }, { status: 500 });
  }
}
