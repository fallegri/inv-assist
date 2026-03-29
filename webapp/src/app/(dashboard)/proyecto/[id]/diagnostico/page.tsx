"use client";

import { use, useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Bot, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { advanceState } = useProjectStore();
  const [context, setContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiProblems, setAiProblems] = useState<string[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (context.length < 50) return alert("Por favor describe un poco más el contexto de la empresa o problema observado (Mínimo 50 caracteres).");
    setIsAnalyzing(true);
    
    try {
      const res = await fetch("/api/ai/analyze-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context })
      });
      const data = await res.json();
      if (data.success) {
        setAiProblems(data.problems);
      } else {
        alert(data.error || "Hubo un error con la IA.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al analizar el contexto.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndAdvance = async () => {
    if (!selectedProblem) return;
    // Next phase is objectives
    await advanceState("objectives");
    router.push(`/proyecto/${id}/objetivos`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fase 1: Diagnóstico</h1>
        <p className="text-gray-400">Describe la situación problemática observada y la IA te ayudará a definir un problema central estructurado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Context Input */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-brand-300">Contexto / Apuntes de campo</label>
          <textarea 
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none placeholder:text-gray-600"
            placeholder="Ejemplo: En el departamento de operaciones hemos notado que los operadores tardan 40% más de tiempo buscando registros en papel en comparación con..."
          />
          <button 
            disabled={isAnalyzing || context.length < 10}
            onClick={handleAnalyze} 
            className="glow-btn flex items-center justify-center gap-2 w-full"
          >
            {isAnalyzing ? <><Loader2 className="animate-spin h-5 w-5" /> Analizando contexto...</> : <><Bot className="h-5 w-5" /> Extraer Problemas IA</>}
          </button>
        </div>

        {/* Right Col: AI Suggestions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-brand-300">
            <Bot className="h-5 w-5" /> Definición Asistida
          </h3>
          
          {aiProblems.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 italic text-center p-4">
              Ingresa el contexto general a la izquierda y la Inteligencia Artificial identificará posibles problemas de investigación.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-300">Selecciona el problema central que deseas abordar:</p>
              {aiProblems.map((prob, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedProblem(prob)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProblem === prob 
                     ? 'bg-brand-900/40 border-brand-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] text-white' 
                     : 'bg-black/30 border-white/5 hover:border-brand-500/50 text-gray-300 hover:bg-black/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${selectedProblem === prob ? 'border-brand-500' : 'border-gray-500'}`}>
                      {selectedProblem === prob && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                    {prob}
                  </div>
                </div>
              ))}
              
              <button 
                disabled={!selectedProblem}
                onClick={handleConfirmAndAdvance}
                className="w-full mt-6 py-3 px-4 bg-brand-600 hover:bg-brand-500 focus:ring-brand-500/20 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
              >
                Confirmar y Continuar a Objetivos <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
