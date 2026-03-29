"use client";

import { use, useEffect } from "react";
import { ProjectStepper } from "@/components/stepper/ProjectStepper";
import { useProjectStore } from "@/lib/store/project-store";

export default function ProjectLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode,
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const { setActiveProject, activeProject } = useProjectStore();

  useEffect(() => {
    // Aquí consultaríamos a la base de datos el proyecto para inicializar la máquina de estados.
    // Como es un scaffolding, simulamos la carga de un proyecto en fase de Diagnóstico.
    if (!activeProject || activeProject.id !== id) {
      setActiveProject({
        id,
        user_id: "demo-user",
        status: "init", // Para este demo, arranca en init
        titulo_tentativo: null,
        carga_horaria_confirmada: true,
        is_exploratory_exception: false
      });
    }
  }, [id, activeProject, setActiveProject]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-4">
        <h2 className="text-xl font-semibold opacity-80">Proyecto: {id === 'new-draft' ? 'Borrador' : id}</h2>
      </div>
      
      <ProjectStepper projectId={id} />
      
      <div className="glass-panel p-6 sm:p-10 border-t-brand-500/50 border-t-[3px] shadow-[0_0_20px_rgba(37,99,235,0.1)]">
        {children}
      </div>
    </div>
  );
}
