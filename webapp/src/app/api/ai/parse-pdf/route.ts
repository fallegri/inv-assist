import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Convertir el PDF a base64 para enviarlo directamente a Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },
            {
              text: `Eres un asistente experto en investigación académica. 
              Analiza el documento PDF adjunto y extrae la información para un "Estado de la Cuestión".
              
              Debes extraer:
              1. Título exacto del documento.
              2. Autor(es) (Apellido, Inicial. ej: Pérez, J.).
              3. Año de publicación.
              4. Aportaciones: ¿Cuál es el principal aporte o hallazgo del estudio? (Máx 255 caracteres).
              5. Vacíos: ¿Qué problemas o áreas NO abordó este estudio? (Máx 255 caracteres).
              6. Diferencias: ¿En qué se diferencia de un estudio convencional sobre este tema? (Máx 255 caracteres).
              7. Similitudes: ¿Qué puntos en común tiene con la literatura clásica? (Máx 255 caracteres).
              8. Diseño Metodológico: Resume brevemente el enfoque, alcance y población usados.

              Responde ESTRICTAMENTE en formato JSON sin ningún texto adicional:
              {
                "titulo": "...",
                "autor": "...",
                "anio": 2024,
                "aportaciones": "...",
                "vacios": "...",
                "diferencias": "...",
                "similitudes": "...",
                "metodologia": "..."
              }`
            }
          ],
          role: "user"
        }
      ],
    });

    if (!result.text) throw new Error("No se recibió respuesta de la IA");
    
    let resultText = result.text.trim();
    // Limpiar markdown code blocks si la IA los incluye
    resultText = resultText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    const json = JSON.parse(resultText);

    return NextResponse.json({ success: true, data: json });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el PDF" }, { status: 500 });
  }
}
