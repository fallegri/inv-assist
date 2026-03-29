import { create } from "zustand";

export type ProjectStatus = 'init' | 'diagnosis' | 'objectives' | 'literature' | 'methodology' | 'complete';

interface Project {
  id: string;
  user_id: string;
  titulo_tentativo: string | null;
  carga_horaria_confirmada: boolean;
  status: ProjectStatus;
  is_exploratory_exception: boolean;
}

interface ProjectState {
  activeProject: Project | null;
  loading: boolean;
  setActiveProject: (project: Project | null) => void;
  advanceState: (newStatus: ProjectStatus) => Promise<void>;
  updateFields: (fields: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProject: null,
  loading: false,

  setActiveProject: (project) => set({ activeProject: project }),

  updateFields: (fields) => 
    set((state) => ({
      activeProject: state.activeProject ? { ...state.activeProject, ...fields } : null
    })),

  advanceState: async (newStatus: ProjectStatus) => {
    const { activeProject } = get();
    if (!activeProject) return;

    set({ loading: true });
    try {
      // LLamar al backend para validar y guardar avance real
      const res = await fetch(`/api/projects/${activeProject.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("No se pudo avanzar el estado");
      
      set({ 
        activeProject: { ...activeProject, status: newStatus },
        loading: false 
      });
    } catch (err) {
      console.error("Error al avanzar fase:", err);
      set({ loading: false });
    }
  }
}));
