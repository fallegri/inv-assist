"use client";

import { use } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { ArrowRight, Book, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LiteraturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { advanceState } = useProjectStore();
  const [articulos, setArticulos] = useState<any[]>([]);

  const handleAgregarManual = () => {
    setArticulos([...articulos, { id: Date.now(), titulo: "Nuevo Artículo...", autor: "Autor", anio: new Date().getFullYear() }]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Fase 3: Estado de la Cuestión</h1>
          <p className="text-gray-400">Recopila los antecedentes teóricos para justificar tu investigación.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium flex gap-2 items-center">
             <Search className="h-4 w-4" /> Buscar en Semantic Scholar
          </button>
          <button onClick={handleAgregarManual} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium flex gap-2 items-center text-white">
             <Plus className="h-4 w-4" /> Manual
          </button>
        </div>
      </div>

      {articulos.length === 0 ? (
        <div className="h-48 glass-panel flex flex-col items-center justify-center text-gray-400 border-dashed border-2">
          <Book className="h-8 w-8 mb-4 text-gray-500" />
          <p>Aún no hay artículos agregados.</p>
          <p className="text-sm">Se recomienda un mínimo de 6 artículos para pasar de fase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articulos.map((art) => (
            <div key={art.id} className="p-4 bg-black/40 border border-white/10 rounded-xl hover:border-brand-500/50 transition-colors">
              <h4 className="font-semibold text-white mb-1 truncate">{art.titulo}</h4>
              <p className="text-xs text-gray-400 mb-3">{art.autor} ({art.anio})</p>
              <div className="space-y-2 mt-4">
                <input placeholder="Aportes al problema..." className="w-full bg-black/50 text-xs px-2 py-1.5 rounded border border-white/5 focus:border-brand-500 outline-none"/>
                <input placeholder="Vacíos que deja..." className="w-full bg-black/50 text-xs px-2 py-1.5 rounded border border-white/5 focus:border-brand-500 outline-none"/>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button 
          onClick={() => {
            advanceState("methodology");
            router.push(`/proyecto/${id}/metodologia`);
          }}
          className="glow-btn flex items-center gap-2"
        >
          Ir a Diseño Metodológico <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
