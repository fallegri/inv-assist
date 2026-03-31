import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { context, problem } = await req.json();

    if (!id || !context || !problem) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Upsert diagnosis evidence
    const result = await query(
      `INSERT INTO evidence (project_id, tipo_evidencia, contenido_raw, problema_central, problema_confirmado)
       VALUES ($1, 'text', $2, $3, true)
       ON CONFLICT (project_id) DO UPDATE 
       SET contenido_raw = $2, problema_central = $3, problema_confirmado = true, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, context, problem]
    );

    return NextResponse.json({ success: true, evidence: result.rows[0] });
  } catch (error) {
    console.error("Save Diagnosis Error:", error);
    return NextResponse.json({ error: "Server error saving diagnosis" }, { status: 500 });
  }
}
