"use client";

import { use, useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { ArrowRight, Microscope, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MetodologiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { advanceState } = useProjectStore();
  
  const [enfoque, setEnfoque] = useState("quantitative");
  const [poblacion, setPoblacion] = useState("100");
  const [muestra, setMuestra] = useState("80");

  const handleCalcularMuestra = () => {
    // Fórmula de Cochran simplificada para n finito
    const N = parseInt(poblacion);
    if (!N) return;
    const Z = 1.96; // 95%
    const p = 0.5;
    const e = 0.05; // 5% error
    const n_0 = (Z * Z * p * (1 - p)) / (e * e);
    const n = n_0 / (1 + ((n_0 - 1) / N));
    setMuestra(Math.ceil(n).toString());
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Fase 4: Diseño Metodológico</h1>
        <p className="text-gray-400">Define el enfoque de tu investigación y calcula la muestra ideal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
             <Target className="text-brand-400 h-5 w-5" /> Enfoque y Alcance
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Enfoque de la Investigación</label>
              <select value={enfoque} onChange={(e) => setEnfoque(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500">
                <option value="quantitative">Cuantitativo</option>
                <option value="qualitative">Cualitativo</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Alcance de la Investigación</label>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500">
                <option>Exploratorio</option>
                <option>Descriptivo</option>
                <option>Correlacional</option>
                <option>Explicativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
             <Microscope className="text-brand-400 h-5 w-5" /> Población y Muestra
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Tamaño de la Población (N)</label>
              <div className="flex gap-2">
                <input type="number" value={poblacion} onChange={(e) => setPoblacion(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500" />
                <button onClick={handleCalcularMuestra} className="bg-white/10 hover:bg-white/20 px-4 rounded-lg font-medium">Calcular n</button>
              </div>
            </div>
            
            <div className="p-4 bg-brand-900/20 border border-brand-500/30 rounded-lg mt-4 text-center">
              <span className="text-sm font-medium text-brand-300 block mb-1">Muestra Representativa Recomendada (error 5%)</span>
              <p className="text-4xl font-bold text-white">n = {muestra}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => {
            advanceState("complete");
            router.push(`/proyecto/${id}/exportar`);
          }}
          className="glow-btn flex items-center gap-2"
        >
          Confirmar Diseño Metodológico <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
