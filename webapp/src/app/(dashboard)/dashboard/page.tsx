"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { PlusCircle, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we fetch projects connected to `user.uid` from our `/api/projects`
    // Mocking for template completion:
    setProjects([]);
    setLoading(false);
  }, [user]);

  const handleCreateProject = async () => {
    // LLamar al API y crear 
    // const res = await fetch("/api/projects", { method: 'POST', body: ... })
    // const newProject = await res.json()
    // router.push(`/proyecto/${newProject.id}/diagnostico`)
    
    // Test temporal (esto es lo que se hará)
    router.push("/proyecto/new-draft/diagnostico");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Panel de Control</h1>
          <p className="text-gray-400">Gestiona tus perfiles de investigación</p>
        </div>
        
        <button 
          onClick={handleCreateProject}
          className="glow-btn flex items-center gap-2 whitespace-nowrap"
        >
          <PlusCircle className="h-4 w-4" /> Nuevo Proyecto
        </button>
      </div>

      {loading ? (
        <div className="h-40 glass-panel flex justify-center items-center">
          <div className="animate-pulse flex gap-2 items-center text-gray-400">
             Cargando tus proyectos...
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 text-center border-dashed border-2 border-white/10 hover:border-brand-500/50 transition-colors">
          <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Aún no tienes proyectos</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Empieza por crear un nuevo perfil de investigación. El asistente te guiará paso a paso.
          </p>
          <button 
            onClick={handleCreateProject}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium border border-white/10"
          >
            Crear mi primer perfil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <Link 
              href={`/proyecto/${proj.id}/diagnostico`} 
              key={proj.id}
              className="glass-panel p-6 hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 space-x-2 rounded text-xs font-semibold ${
                  proj.status === 'init' ? 'bg-gray-500/20 text-gray-300' :
                  proj.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                  'bg-brand-500/20 text-brand-400'
                }`}>
                  Fase: {proj.status.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-white mb-2 line-clamp-2">
                {proj.titulo_tentativo || "Proyecto sin título"}
              </h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-3">
                {proj.area_estudio || "Área de estudio pendiente"}
              </p>
              <div className="flex items-center text-brand-400 text-sm font-medium group-hover:text-brand-300">
                Continuar Desarrollo <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
