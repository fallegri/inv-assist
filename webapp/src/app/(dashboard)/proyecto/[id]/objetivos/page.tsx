"use client";

import { use, useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { ArrowRight, Bot, Target, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

// Lista compartida en db y frontend para validación rápida optimista
const BLOOM_VERBS_VALIDOS = ["analizar", "determinar", "identificar", "evaluar", "describir", "proponer", "establecer"];

export default function ObjetivosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  // No dependemos del store para la navegación
  const [verbo, setVerbo] = useState("");
  const [objeto, setObjeto] = useState("");
  const [condicion, setCondicion] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{valid: boolean, message: string} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const checkVerbSync = (v: string) => {
    const verbList = BLOOM_VERBS_VALIDOS;
    const isValido = verbList.includes(v.toLowerCase().trim());
    return isValido;
  };

  const handleValidarGral = async () => {
    const isGralValido = checkVerbSync(verbo);
    if (!isGralValido) {
      setAiAnalysis({
        valid: false,
        message: "El verbo ingresado no está en la recomendación de la Taxonomía de Bloom. Verbos comunes bloqueados: 'Crear', 'Desarrollar', 'Programar'."
      });
      return;
    }
    
    setIsValidating(true);
    try {
      // Validar Coherencia Socrática mediante Gemini
      const res = await fetch("/api/ai/validate-objective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verbo, objeto, condicion })
      });
      
      const data = await res.json();
      if (data.success) {
        setAiAnalysis({
          valid: data.valid,
          message: data.message
        });
      } else {
        setAiAnalysis({ valid: false, message: data.error || "Ocurrió un error." });
      }
    } catch (err) {
      setAiAnalysis({ valid: false, message: "Error al invocar IA de validación." });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fase 2: Objetivos de Investigación</h1>
        <p className="text-gray-400">Formula un objetivo general alineado a la Taxonomía de Bloom para asegurar coherencia metodológica.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/30 border border-white/5 rounded-xl p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-brand-500" /> Formulación del Objetivo General
            </h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 flex flex-col gap-1">
                <label className="text-xs text-brand-400 uppercase tracking-widest font-semibold flex justify-between">
                  Verbo 
                  {!checkVerbSync(verbo) && verbo.length > 2 && <AlertTriangle className="h-4 w-4 text-orange-400" />}
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={verbo} 
                  onChange={(e) => setVerbo(e.target.value)}
                  placeholder="Ej: Determinar"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Variables / Objeto de estudio</label>
                <input 
                  type="text" 
                  value={objeto}
                  onChange={(e) => setObjeto(e.target.value)}
                  placeholder="Ej: el impacto de la herramienta digital X..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <div className="col-span-3 flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Condición / Contexto</label>
                <input 
                  type="text" 
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  placeholder="Ej: en el proceso operativo del departamento Y durante 2026."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-brand-900/20 border border-brand-500/20 rounded-lg">
              <span className="text-sm font-medium text-brand-200 block mb-1">Vista Previa:</span>
              <p className="text-white text-lg">
                {verbo || "___"} {objeto || "___"} {condicion || "___"}.
              </p>
            </div>

            <button 
              onClick={handleValidarGral}
              disabled={!verbo || !objeto || isValidating}
              className="mt-6 px-4 py-2 glow-btn text-white rounded-lg w-full font-medium"
            >
              {isValidating ? "Validando..." : "Validar con IA y Bloom"}
            </button>
          </div>
        </div>

        {/* Panel IA */}
        <div className="bg-gradient-to-br from-brand-900/30 to-purple-900/30 border border-white/10 rounded-xl p-6 h-fit">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-brand-300">
            <Bot className="h-5 w-5" /> Panel Socrático IA
          </h3>
          
          {aiAnalysis ? (
            <div className={`p-4 rounded-lg border ${aiAnalysis.valid ? 'bg-green-500/10 border-green-500/30 text-green-200' : 'bg-orange-500/10 border-orange-500/30 text-orange-200'}`}>
               {aiAnalysis.message}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Construye el objetivo a la izquierda y presiona "Validar" para que la IA evalúe la coherencia.
            </p>
          )}

          {aiAnalysis?.valid && (
            <button 
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  // Guardar objetivo en DB
                  await fetch(`/api/projects/${id}/objectives`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tipo: "general",
                      verbo,
                      descripcion: `${verbo} ${objeto} ${condicion}`.trim(),
                      orden: 1
                    })
                  });
                  // Avanzar fase directamente
                  await fetch(`/api/projects/${id}/advance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "literature" })
                  });
                  router.push(`/proyecto/${id}/literatura`);
                } catch (e) {
                  alert("Error al guardar el objetivo. Intenta de nuevo.");
                } finally {
                  setIsSaving(false);
                }
              }}
              className="mt-6 w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 rounded-lg text-white font-medium transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : <> Guardar y Continuar <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
