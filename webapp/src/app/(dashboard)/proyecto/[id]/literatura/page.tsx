"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { ArrowRight, Book, Plus, Search, Upload, FileText, Loader2, Trash2, Save, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface LiteratureRecord {
  id?: string;
  titulo: string;
  autor: string;
  anio: number;
  aportaciones: string;
  vacios: string;
  diferencias: string;
  similitudes: string;
  metodologia: string;
  source: 'manual' | 'pdf';
  isEditing?: boolean;
}

export default function LiteraturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { advanceState } = useProjectStore();
  
  const [articulos, setArticulos] = useState<LiteratureRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos existentes
  useEffect(() => {
    fetch(`/api/projects/${id}/literature`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const mapped = data.records.map((r: any) => ({
            ...r,
            metodologia: r.metodologia_referencia || "",
          }));
          setArticulos(mapped);
        }
        setLoading(false);
      });
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/parse-pdf", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      
      if (result.success) {
        const newRecord: LiteratureRecord = {
          ...result.data,
          source: 'pdf',
          id: `temp-${Date.now()}`
        };
        setArticulos(prev => [...prev, newRecord]);
      } else {
        alert(result.error || "Error al analizar PDF");
      }
    } catch (err) {
      alert("Error de conexión al procesar el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAgregarManual = () => {
    const newRecord: LiteratureRecord = {
      id: `temp-${Date.now()}`,
      titulo: "",
      autor: "",
      anio: new Date().getFullYear(),
      aportaciones: "",
      vacios: "",
      diferencias: "",
      similitudes: "",
      metodologia: "",
      source: 'manual',
      isEditing: true
    };
    setArticulos([...articulos, newRecord]);
  };

  const handleSaveAll = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/literature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: articulos })
      });
      if (res.ok) alert("Progreso guardado correctamente.");
    } catch (err) {
      alert("Error al guardar.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Fase 3: Estado de la Cuestión</h1>
          <p className="text-gray-400">Analiza tus antecedentes. Arrastra PDFs para extraer datos automáticamente o agrégalos manualmente.</p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium flex gap-2 items-center text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Upload className="h-4 w-4" /> 
            {isUploading ? "Analizando..." : "Subir PDF"}
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          <button onClick={handleAgregarManual} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium flex gap-2 items-center text-gray-300 transition-all">
             <Plus className="h-4 w-4" /> Manual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin h-8 w-8 text-brand-500" />
           <p className="text-gray-400">Cargando biblioteca...</p>
        </div>
      ) : articulos.length === 0 ? (
        <div className="h-64 glass-panel flex flex-col items-center justify-center text-gray-400 border-dashed border-2 border-white/10">
          <div className="p-4 rounded-full bg-brand-500/5 mb-4">
            <Book className="h-10 w-10 text-brand-500/50" />
          </div>
          <p className="text-lg font-medium text-gray-300">Tu biblioteca está vacía</p>
          <p className="text-sm">Arrastra un PDF de investigación para que la IA extraiga los campos clave.</p>
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-600">Requisito mínimo académico</span>
            <div className="flex gap-1">
               {[1,2,3,4,5,6].map(i => <div key={i} className="w-6 h-1 rounded-full bg-gray-800"></div>)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto glass-panel border border-white/10 rounded-xl">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-4 py-3 border-b border-white/10">Autor(es) y Año</th>
                <th className="px-4 py-3 border-b border-white/10">Título del Documento</th>
                <th className="px-4 py-3 border-b border-white/10">Aportaciones</th>
                <th className="px-4 py-3 border-b border-white/10">Vacíos</th>
                <th className="px-4 py-3 border-b border-white/10 w-1/6">Metodología Usada</th>
                <th className="px-4 py-3 border-b border-white/10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {articulos.map((art, idx) => (
                <tr key={art.id || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-4 align-top">
                    <input 
                      value={`${art.autor} (${art.anio})`}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = val.match(/(.*)\s\((\d{4})\)/);
                        if(match) {
                            const newArt = [...articulos];
                            newArt[idx].autor = match[1];
                            newArt[idx].anio = parseInt(match[2]);
                            setArticulos(newArt);
                        }
                      }}
                      className="bg-transparent text-brand-400 font-medium focus:outline-none w-full" 
                    />
                  </td>
                  <td className="px-4 py-4 align-top max-w-[200px]">
                    <textarea 
                      value={art.titulo}
                      onChange={(e) => {
                          const newArt = [...articulos];
                          newArt[idx].titulo = e.target.value;
                          setArticulos(newArt);
                      }}
                      className="bg-transparent text-white w-full focus:outline-none resize-none leading-snug"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                     <textarea 
                      value={art.aportaciones}
                      onChange={(e) => {
                          const newArt = [...articulos];
                          newArt[idx].aportaciones = e.target.value;
                          setArticulos(newArt);
                      }}
                      className="bg-transparent text-gray-400 text-xs w-full focus:outline-none resize-none min-h-[60px]"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                    <textarea 
                      value={art.vacios}
                      onChange={(e) => {
                          const newArt = [...articulos];
                          newArt[idx].vacios = e.target.value;
                          setArticulos(newArt);
                      }}
                      className="bg-transparent text-gray-400 text-xs w-full focus:outline-none resize-none min-h-[60px]"
                    />
                  </td>
                  <td className="px-4 py-4 align-top">
                     <textarea 
                      value={art.metodologia}
                      onChange={(e) => {
                          const newArt = [...articulos];
                          newArt[idx].metodologia = e.target.value;
                          setArticulos(newArt);
                      }}
                      className="bg-brand-500/5 p-2 rounded border border-brand-500/10 text-gray-300 text-[11px] w-full focus:outline-none resize-none italic min-h-[60px]"
                    />
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <button 
                      onClick={() => setArticulos(articulos.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-white/5">
        <button 
          onClick={handleSaveAll}
          className="px-6 py-2 border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
        >
          <Save className="h-4 w-4" /> Guardar Borrador
        </button>
        
        <button 
          onClick={async () => {
             await handleSaveAll();
             await advanceState("methodology");
             router.push(`/proyecto/${id}/metodologia`);
          }}
          disabled={articulos.length < 1}
          className="glow-btn flex items-center gap-2 px-8 h-12"
        >
          {articulos.length < 6 ? "Continuar de todas formas" : "Siguiente Fase"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
