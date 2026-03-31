import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { verbo, objeto, condicion } = await req.json();

    if (!verbo || !objeto) {
      return NextResponse.json(
        { error: "Faltan partes clave del objetivo (verbo u objeto de estudio)." },
        { status: 400 }
      );
    }

    const completeObjective = `${verbo} ${objeto} ${condicion || ""}`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Eres un estricto evaluador metodológico.
El estudiante ha formulado el siguiente Objetivo General de Investigación:
"${completeObjective}"

Tu tarea es evaluar la coherencia de este objetivo según metodologías estándares (ej. Sampieri).
Reglas:
1. El objetivo tiene que buscar "construir conocimiento" o "analizar la realidad".
2. Si el objetivo busca "construir un software", "desarrollar un manual", o "implementar un sistema" para la empresa, entonces metodológicamente es un objetivo inválido (escro un trabajo técnico, no investigación), salvo que el objeto sea "evaluar el impacto del software".
3. Da una retroalimentación socrática si el estudiante falla, o un mensaje de éxito si pasa.

Responde ÚNICAMENTE en formato JSON estricto con la siguiente estructura:
{
  "valid": true o false,
  "message": "Tu explicación socrática de por qué es válido o no, explicando qué debería medir o analizar."
}
      `,
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) throw new Error("No text from AI");
    
    // Sometimes the model might wrap the json in markdown, though responseMimeType usually helps preventing it.
    let text = response.text.trim();
    if(text.startsWith('\`\`\`json')){
        text = text.replace(/^\`\`\`json/,"").replace(/\`\`\`$/,"");
    }

    const parsedData = JSON.parse(text);

    return NextResponse.json({ 
        success: true, 
        valid: parsedData.valid, 
        message: parsedData.message 
    });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: "Error de IA evaluando el objetivo: " + (error.message || "Fallo desconocido") },
      { status: 500 }
    );
  }
}
