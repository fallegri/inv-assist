import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing ID or status" }, { status: 400 });
    }

    const result = await query(
      `UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: result.rows[0] });
  } catch (error) {
    console.error("Advance Phase Error:", error);
    return NextResponse.json({ error: "Server error advancing phase" }, { status: 500 });
  }
}
