import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
// import { query } from "@/lib/db"; (Para consultar datos reales)

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || "0000";

    // 1. Aquí se traería la información del proyecto desde Postgres:
    // const { rows } = await query(`... SELECT institutions FROM user_profiles JOIN projects... `)
    // Para simplificar el Scaffolding demostrativo:
    const institution = "Institución Abierta (MOCK)";
    const title = "Perfil de Investigación - " + projectId;
    const author = "Estudiante Investigador";

    // 2. Creación del Documento DOCX (APA 7)
    const doc = new Document({
      sections: [{
        properties: {
            page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 2.54 cm margins
            }
        },
        children: [
            // Portada
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: institution, bold: true, size: 28, font: "Times New Roman" }),
                ],
                spacing: { before: 200, after: 800 }
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: title, bold: true, size: 28, font: "Times New Roman" }),
                ],
                spacing: { after: 1200 }
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: author, size: 24, font: "Times New Roman" }),
                ],
            }),

            new Paragraph({ text: "", spacing: { before: 4000 } }), // Salto simulado

            // Contenido
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "I. El Problema de Investigación", font: "Times New Roman", size: 24, bold: true })]
            }),
            new Paragraph({
                spacing: { before: 400, line: 480 },
                children: [
                    new TextRun({
                        font: "Times New Roman",
                        size: 24,
                        text: "El presente proyecto ha derivado problemas sustanciales sobre las deficiencias inventariadas y..."
                    })
                ]
            })
        ],
      }],
    });

    // 3. Empaquetamiento y Envío
    const buffer = await Packer.toBuffer(doc);
    
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Perfil_${projectId}.docx"`
      }
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to build docx" }, { status: 500 });
  }
}
