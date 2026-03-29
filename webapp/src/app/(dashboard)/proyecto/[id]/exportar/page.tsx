"use client";

import { use } from "react";
import { Download, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ExportarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/export?projectId=${id}`, {
        method: "POST"
      });

      if (!res.ok) throw new Error("Error en la exportación");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Perfil_de_Investigacion_${id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
    } catch (err) {
      console.error(err);
      alert("Hubo un error exportando el archivo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 ring-4 ring-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
        <CheckCircle className="h-12 w-12 text-green-400" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-4 text-center">¡Perfil de Investigación Terminado!</h1>
      
      <p className="text-gray-400 text-center max-w-lg mb-10 text-lg">
        La Matriz de Consistencia y el documento principal han sido estructurados. Ahora puedes descargar tu perfil completo en formato APA 7.
      </p>

      <div className="glass-panel p-8 w-full max-w-md flex flex-col gap-4">
         <div className="flex items-center gap-4 text-gray-300 p-4 bg-white/5 rounded-lg border border-white/10">
            <FileText className="h-8 w-8 text-brand-400" />
            <div>
              <p className="font-semibold text-white">Perfil_Final.docx</p>
              <p className="text-sm">Matriz de consistencia, estado del arte y metodología.</p>
            </div>
         </div>

         <button 
          onClick={handleExport}
          disabled={isExporting}
          className="glow-btn mt-4 flex items-center justify-center gap-2 h-12 w-full text-lg shadow-[0_0_20px_rgba(37,99,235,0.6)]"
         >
            {isExporting ? <><Loader2 className="animate-spin" /> Generando DOCX...</> : <><Download /> Descargar en APA 7</>}
         </button>
      </div>
    </div>
  );
}
