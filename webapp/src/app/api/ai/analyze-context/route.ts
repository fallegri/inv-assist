import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { context } = await req.json();

    if (!context || context.length < 50) {
      return NextResponse.json(
        { error: "Contexto demasiado corto. Por favor provee al menos 50 caracteres." },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Eres un asesor metodológico experto en investigación científica.
El estudiante proporciona los siguientes apuntes de campo o situación observada:
"${context}"

Tu tarea es extraer o sugerir 3 posibles "Problemas Centrales de Investigación" claros y viables derivados de esta observación.
Sé conciso y directo.
Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "problems": [
    "Problema 1...",
    "Problema 2...",
    "Problema 3..."
  ]
}
      `,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No text from AI");
    
    const parsedData = JSON.parse(response.text);

    return NextResponse.json({ success: true, problems: parsedData.problems });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: "Error de IA al analizar el contexto." },
      { status: 500 }
    );
  }
}
