import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data } = await req.json(); // Array or single object

    if (!id || !data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const records = Array.isArray(data) ? data : [data];

    const results = [];
    for (const record of records) {
      const res = await query(
        `INSERT INTO literature_review 
         (project_id, anio, autor, titulo, aportaciones, vacios, diferencias, similitudes, metodologia_referencia, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          id, 
          record.anio || null, 
          record.autor, 
          record.titulo, 
          record.aportaciones || "", 
          record.vacios || "", 
          record.diferencias || "", 
          record.similitudes || "", 
          record.metodologia || "", 
          record.source || "manual"
        ]
      );
      results.push(res.rows[0]);
    }

    return NextResponse.json({ success: true, records: results });
  } catch (error) {
    console.error("Save Literature Error:", error);
    return NextResponse.json({ error: "Server error saving literature" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const res = await query(`SELECT * FROM literature_review WHERE project_id = $1 ORDER BY created_at ASC`, [id]);
        return NextResponse.json({ success: true, records: res.rows });
    } catch (error) {
        return NextResponse.json({ error: "Error fetching literature" }, { status: 500 });
    }
}
