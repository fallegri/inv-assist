"use client";

import { use, useState, useEffect, useRef } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Bot, Loader2, ArrowRight, Mic, MicOff, RefreshCw, Check, Edit2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DiagnosticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  // No dependemos del store para avanzar — usamos el id de la URL directamente
  
  // States for Context
  const [context, setContext] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  
  // States for AI Proposal
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposedProblem, setProposedProblem] = useState("");
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [tempEditedProblem, setTempEditedProblem] = useState("");

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) setContext(prev => (prev + " " + finalTranscript).trim());
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        setIsListening(false);
      };
    } else {
      setIsSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setProposedProblem(""); // Reset proposal when context changes
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAnalyze = async () => {
    if (context.length < 20) return alert("Por favor describe un poco más el contexto (Mínimo 20 caracteres).");
    setIsAnalyzing(true);
    setIsEditingManually(false);
    
    try {
      const res = await fetch("/api/ai/analyze-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context })
      });
      const data = await res.json();
      if (data.success) {
        // Obtenemos la propuesta inicial (primera de la lista)
        setProposedProblem(data.problems[0] || "");
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

  const handleStartManualEdit = () => {
    setTempEditedProblem(proposedProblem);
    setIsEditingManually(true);
  };

  const handleSaveManualEdit = () => {
    setProposedProblem(tempEditedProblem);
    setIsEditingManually(false);
  };

  const handleConfirmAndAdvance = async () => {
    if (!proposedProblem) return;
    
    try {
      // 1. Guardar el diagnóstico en la DB
      const diagRes = await fetch(`/api/projects/${id}/diagnosis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, problem: proposedProblem })
      });

      if (!diagRes.ok) {
        const err = await diagRes.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar el diagnóstico");
      }

      // 2. Avanzar el estado del proyecto directamente (sin depender del store)
      await fetch(`/api/projects/${id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "objectives" })
      });

      // 3. Navegar a la siguiente fase
      router.push(`/proyecto/${id}/objetivos`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar el diagnóstico. Intenta de nuevo.");
    }
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-brand-300">Contexto / Apuntes de campo</label>
              {!isSpeechSupported && <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">Voz no soportada</span>}
            </div>
            {isSpeechSupported && (
              <button 
                onClick={toggleListening}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' 
                    : 'bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]'
                }`}
              >
                {isListening ? <><MicOff className="h-3 w-3" /> Detener Voz</> : <><Mic className="h-3 w-3" /> Dictar por Voz</>}
              </button>
            )}
          </div>
          <textarea 
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
              setProposedProblem("");
            }}
            className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none placeholder:text-gray-600"
            placeholder="Ejemplo: En el departamento de operaciones hemos notado..."
          />
          <button 
            disabled={isAnalyzing || context.length < 10}
            onClick={handleAnalyze} 
            className="glow-btn flex items-center justify-center gap-2 w-full"
          >
            {isAnalyzing ? <><Loader2 className="animate-spin h-5 w-5" /> Analizando...</> : <><Bot className="h-5 w-5" /> {proposedProblem ? "Generar otra propuesta" : "Proponer Problema Inicial"}</>}
          </button>
        </div>

        {/* Right Col: AI Suggestions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative flex flex-col h-full">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-brand-300">
            <Bot className="h-5 w-5" /> Propuesta del Sistema
          </h3>
          
          {!proposedProblem && !isAnalyzing ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 italic text-center p-4">
              La IA analizará tu contexto y te propondrá un problema de investigación inicial para validar.
            </div>
          ) : isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
              <p className="text-gray-400 animate-pulse">Generando propuesta estructurada...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              <div className="p-5 rounded-lg bg-brand-500/5 border border-brand-500/20 text-white min-h-[120px] relative group">
                {isEditingManually ? (
                  <textarea 
                    autoFocus
                    value={tempEditedProblem}
                    onChange={(e) => setTempEditedProblem(e.target.value)}
                    className="w-full h-32 bg-black/60 border border-white/20 rounded p-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                ) : (
                  <p className="text-lg leading-relaxed font-light italic">
                    "{proposedProblem}"
                  </p>
                )}
                
                {!isEditingManually && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleStartManualEdit} className="p-2 hover:bg-white/10 rounded-full text-brand-400" title="Editar manualmente">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {isEditingManually ? (
                <div className="flex gap-3">
                  <button onClick={handleSaveManualEdit} className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all">
                    <Save className="h-4 w-4" /> Guardar Cambios
                  </button>
                  <button onClick={() => setIsEditingManually(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-all border border-white/10">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleAnalyze} className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 flex items-center justify-center gap-2 transition-all">
                    <RefreshCw className="h-3 w-3" /> Nueva Propuesta
                  </button>
                  <button onClick={handleStartManualEdit} className="py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 flex items-center justify-center gap-2 transition-all">
                    <Edit2 className="h-3 w-3" /> Mejorar Manualmente
                  </button>
                </div>
              )}

              <div className="mt-auto">
                <button 
                  disabled={isEditingManually}
                  onClick={handleConfirmAndAdvance}
                  className="glow-btn flex items-center justify-center gap-2 w-full h-12 disabled:opacity-50"
                >
                  <Check className="h-5 w-5" /> Conservar y Continuar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
