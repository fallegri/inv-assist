import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "No projectId provided" }, { status: 400 });
    }

    // 1. Obtener Datos Maestros del Proyecto y Usuario
    const projectRes = await query(`
      SELECT p.*, u.nombre as student_name, u.institucion, u.carrera, u.area_estudio
      FROM projects p
      JOIN user_profiles u ON p.user_id = u.id
      WHERE p.id = $1
    `, [projectId]);

    if (projectRes.rowCount === 0) throw new Error("Proyecto no encontrado");
    const p = projectRes.rows[0];

    // 2. Obtener Diagnóstico
    const evidenceRes = await query(`SELECT * FROM evidence WHERE project_id = $1`, [projectId]);
    const evidence = evidenceRes.rows[0] || {};

    // 3. Obtener Objetivos
    const objectivesRes = await query(`SELECT * FROM objectives WHERE project_id = $1 ORDER BY tipo DESC, orden ASC`, [projectId]);
    const objGeneral = objectivesRes.rows.find(o => o.tipo === 'general');
    const objSpecifics = objectivesRes.rows.filter(o => o.tipo === 'specific');

    // 4. Obtener Literatura (Estado del Arte)
    const litRes = await query(`SELECT * FROM literature_review WHERE project_id = $1 ORDER BY anio DESC`, [projectId]);
    const literature = litRes.rows;

    // 5. Obtener Metodología
    const methRes = await query(`SELECT * FROM methodology WHERE project_id = $1`, [projectId]);
    const meth = methRes.rows[0] || {};

    // 6. Construcción del DOCX
    const children: any[] = [
      // Logo/Header Universitario (Placeholder de texto)
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({ text: p.institucion?.toUpperCase() || "UNIVERSIDAD", bold: true, size: 28, font: "Arial" }),
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({ text: `Escuela de ${p.carrera || "Carrera"}`, size: 24, font: "Arial" }),
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({ text: "", spacing: { before: 1200 } }),

      // Título
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({ text: p.titulo_tentativo || "TÍTULO DE INVESTIGACIÓN", bold: true, size: 32, font: "Arial" }),
        ],
        spacing: { after: 800 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
            new TextRun({ text: "Perfil de Investigación", size: 24, font: "Arial", italics: true }),
        ],
        spacing: { after: 1500 }
      }),

      // Datos Info
      new Paragraph({
        children: [
            new TextRun({ text: "Estudiante: ", bold: true, font: "Arial", size: 22 }),
            new TextRun({ text: p.student_name, font: "Arial", size: 22 }),
        ]
      }),
      new Paragraph({
        children: [
            new TextRun({ text: "Área de estudio: ", bold: true, font: "Arial", size: 22 }),
            new TextRun({ text: p.area_estudio || "General", font: "Arial", size: 22 }),
        ]
      }),
      new Paragraph({
        children: [
            new TextRun({ text: "Fecha: ", bold: true, font: "Arial", size: 22 }),
            new TextRun({ text: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), font: "Arial", size: 22 }),
        ]
      }),

      new Paragraph({ text: "", spacing: { before: 1000 } }),

      // 1. Planteamiento
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "1. Planteamiento del Problema", bold: true, size: 28, font: "Arial" })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "1.1 Descripción de la Situación Problemática", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: evidence.contenido_raw || "Falta descripción.", font: "Arial", size: 22 })],
        spacing: { after: 300, line: 360 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "1.2 Formulación del Problema", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: evidence.problema_central || "¿Cuál es el problema principal?", font: "Arial", size: 22, italics: true })],
        spacing: { after: 400, line: 360 }
      }),

      // 2. Objetivos
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "2. Objetivos de la Investigación", bold: true, size: 28, font: "Arial" })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.1 Objetivo General", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: objGeneral?.descripcion || "Definir objetivo general.", font: "Arial", size: 22 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "2.2 Objetivos Específicos", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      ...objSpecifics.map((o, idx) => new Paragraph({
          children: [new TextRun({ text: `${idx + 1}. ${o.descripcion}`, font: "Arial", size: 22 })],
          bullet: { level: 0 },
          spacing: { after: 100 }
      })),

      // 3. Estado de la Cuestión (Tabla)
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "3. Estado de la Cuestión", bold: true, size: 28, font: "Arial" })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: `A continuación se presenta la revisión de ${literature.length} antecedentes relacionados:`, font: "Arial", size: 22 })],
        spacing: { after: 200 }
      }),
    ];

    // TABLA de Literatura
    if (literature.length > 0) {
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Header Row
            new TableRow({
              children: [
                "Autor(es) y Año", "Título", "Aportaciones", "Vacíos", "Diseño Metodológico"
              ].map(header => new TableCell({
                shading: { fill: "F2F2F2" },
                children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, size: 18, font: "Arial" })], alignment: AlignmentType.CENTER })]
              }))
            }),
            // Data Rows
            ...literature.map(art => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${art.autor} (${art.anio})`, size: 18, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: art.titulo, size: 18, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: art.aportaciones, size: 16, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: art.vacios, size: 16, font: "Arial" })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: art.metodologia_referencia || "No especificado", size: 16, font: "Arial", italics: true })] })] }),
              ]
            }))
          ]
        });
        children.push(table);
    }

    // 4. Metodología
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "4. Diseño Metodológico", bold: true, size: 28, font: "Arial" })],
        spacing: { before: 600, after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.1 Enfoque y Alcance", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: `La presente investigación adopta un enfoque ${meth.enfoque || "___"} con alcance ${meth.alcance || "___"}.`, font: "Arial", size: 22 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.2 Población y Muestra", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: `Población: ${meth.poblacion_size || "___"} personas. Muestra calculada: ${meth.muestra_size || "___"} participantes.`, font: "Arial", size: 22 })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "4.3 Instrumentos de Recolección", bold: true, size: 24, font: "Arial" })],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: `Se utilizarán los siguientes instrumentos: ${Array.isArray(meth.instrumentos) ? meth.instrumentos.join(", ") : (meth.instrumentos || "Por definir")}.`, font: "Arial", size: 22 })],
        spacing: { after: 200 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    
    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Perfil_${p.titulo_tentativo?.replace(/\s+/g, '_') || projectId}.docx"`
      }
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Fallo al construir DOCX: " + error.message }, { status: 500 });
  }
}
