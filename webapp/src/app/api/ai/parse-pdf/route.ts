import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer texto del PDF
    const data = await pdf(buffer);
    const text = data.text;

    if (!text || text.length < 100) {
      throw new Error("El PDF parece estar vacío o protegido por contraseña.");
    }

    // Limitar texto para Gemini (primeras 30000 caracteres)
    const limitedText = text.slice(0, 30000);

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `
      Eres un asistente experto en investigación académica. 
      Analiza el siguiente texto de un artículo/documento científico y extrae la información para un "Estado de la Cuestión".
      
      Debes extraer:
      1. Título exacto del documento.
      2. Autor(es) (Apellido, Inicial. ej: Pérez, J.).
      3. Año de publicación.
      4. Aportaciones: ¿Cuál es el principal aporte o hallazgo del estudio? (Máx 255 caracteres).
      5. Vacíos: ¿Qué problemas o áreas NO abordó este estudio? (Máx 255 caracteres).
      6. Diferencias: ¿En qué se diferencia de un estudio convencional sobre este tema? (Máx 255 caracteres).
      7. Similitudes: ¿Qué puntos en común tiene con la literatura clásica? (Máx 255 caracteres).
      8. Diseño Metodológico: Resume brevemente el enfoque, alcance y población usados en el documento.

      Responde ESTRICTAMENTE en formato JSON:
      {
        "titulo": "...",
        "autor": "...",
        "anio": 2024,
        "aportaciones": "...",
        "vacios": "...",
        "diferencias": "...",
        "similitudes": "...",
        "metodologia": "..."
      }

      TEXTO DEL DOCUMENTO:
      ${limitedText}
      `,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!result.text) throw new Error("No se recibió respuesta de la IA");
    
    let resultText = result.text.trim();
    resultText = resultText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    const json = JSON.parse(resultText);

    return NextResponse.json({ success: true, data: json });
  } catch (error: any) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: error.message || "Error al procesar el PDF" }, { status: 500 });
  }
}
