"use client";

import { useProjectStore, ProjectStatus } from "@/lib/store/project-store";
import { Check, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "diagnosis", label: "01. Diagnóstico", path: "diagnostico" },
  { id: "objectives", label: "02. Objetivos", path: "objetivos" },
  { id: "literature", label: "03. Estado del Arte", path: "literatura" },
  { id: "methodology", label: "04. Metodología", path: "metodologia" },
  { id: "complete", label: "05. Exportación", path: "exportar" },
] as const;

export function ProjectStepper({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  // Using active project status. If null, we default to init.
  const { activeProject, loading } = useProjectStore();
  const currentStatus = activeProject?.status || "init";
  
  // Logic to determine if a phase is accessible 
  // For simplicity: A phase is unlocked if standard progression has passed it.
  const getPhaseState = (phaseId: string) => {
    const statusIndex = PHASES.findIndex(p => p.id === currentStatus);
    const thisIndex = PHASES.findIndex(p => p.id === phaseId);
    
    // If complete, everything is done
    if (currentStatus === "complete") return "completed";
    
    // Si estamos en init y es el 1, activo. Si no, locked.
    if (currentStatus === "init") {
      return phaseId === "diagnosis" ? "active" : "locked";
    }

    if (thisIndex < statusIndex) return "completed";
    if (thisIndex === statusIndex) return "active";
    // Si la fase anterior está completed, esta es actuable pero "pending"
    // (A menos que haya validación estricta, lo bloqueamos visualmente)
    return "locked"; 
  };

  return (
    <div className="w-full glass-panel p-4 mb-8 overflow-x-auto">
      {loading ? (
        <div className="flex animate-pulse items-center justify-center p-2 text-brand-300 gap-2">
          <Loader2 className="animate-spin h-5 w-5" /> Sincronizando estado...
        </div>
      ) : (
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {PHASES.map((phase, phaseIdx) => {
              const state = getPhaseState(phase.id);
              const isActiveRoute = pathname.includes(phase.path);

              return (
                <li key={phase.id} className={cn(
                  "relative sm:flex-1",
                  phaseIdx !== PHASES.length - 1 ? "pr-8 sm:pr-20" : ""
                )}>
                  {/* Conector Line */}
                  {phaseIdx !== PHASES.length - 1 && (
                    <div className="absolute top-4 left-0 -ml-px mt-0.5 w-full h-0.5 bg-gray-700" aria-hidden="true">
                      {state === "completed" && (
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: "100%" }}></div>
                      )}
                    </div>
                  )}

                  {/* Nodo y Link */}
                  {state === "completed" ? (
                    <Link href={`/proyecto/${projectId}/${phase.path}`} className="group relative flex items-center justify-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 group-hover:bg-brand-500 ring-2 ring-transparent transition-all shadow-[0_0_10px_rgba(37,99,235,0.5)] z-10">
                        <Check className="h-5 w-5 text-white" />
                      </span>
                      <span className="absolute -bottom-6 text-xs font-medium text-brand-400 whitespace-nowrap hidden sm:block">
                        {phase.label}
                      </span>
                    </Link>
                  ) : state === "active" ? (
                    <Link href={`/proyecto/${projectId}/${phase.path}`} className="relative flex items-center justify-center" aria-current="step">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-500 bg-black z-10">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(37,99,235,1)]" />
                      </span>
                      <span className="absolute -bottom-6 text-xs font-bold text-white whitespace-nowrap shadow-black drop-shadow-md hidden sm:block">
                        {phase.label}
                      </span>
                    </Link>
                  ) : (
                    <div className="group relative flex items-center justify-center cursor-not-allowed">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-gray-900 z-10">
                        <Lock className="h-3 w-3 text-gray-500" />
                      </span>
                      <span className="absolute -bottom-6 text-xs font-medium text-gray-500 whitespace-nowrap hidden sm:block">
                        {phase.label}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
    </div>
  );
}
