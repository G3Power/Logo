import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deriveIconSpec,
  newSpecId,
  type AppIconSpec,
  type Brief,
  type LogoSpec,
} from "@logomaker/logo-engine";

export interface Project {
  id: string;
  brief: Brief;
  spec: LogoSpec;
  iconSpec: AppIconSpec;
  /** Undo stack of previous specs (most recent last). */
  history: LogoSpec[];
  /** Redo stack. */
  future: LogoSpec[];
  createdAt: number;
  updatedAt: number;
}

interface SessionState {
  /** Brief currently being generated for (brief -> gallery flow). */
  draftBrief: Brief | null;
  concepts: LogoSpec[];
  conceptSource: "ai" | "builtin" | null;
}

interface State {
  hydrated: boolean;
  projects: Project[];
  session: SessionState;
}

type Action =
  | { type: "hydrate"; projects: Project[] }
  | { type: "set-session"; brief: Brief; concepts: LogoSpec[]; source: "ai" | "builtin" }
  | { type: "clear-session" }
  | { type: "add-project"; project: Project }
  | { type: "delete-project"; id: string }
  | { type: "update-spec"; id: string; spec: LogoSpec; pushHistory: boolean }
  | { type: "update-icon"; id: string; iconSpec: AppIconSpec }
  | { type: "undo"; id: string }
  | { type: "redo"; id: string }
  | { type: "replace-projects"; projects: Project[] };

const MAX_HISTORY = 50;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, hydrated: true, projects: action.projects };
    case "set-session":
      return {
        ...state,
        session: { draftBrief: action.brief, concepts: action.concepts, conceptSource: action.source },
      };
    case "clear-session":
      return { ...state, session: { draftBrief: null, concepts: [], conceptSource: null } };
    case "add-project":
      return { ...state, projects: [action.project, ...state.projects] };
    case "delete-project":
      return { ...state, projects: state.projects.filter((p) => p.id !== action.id) };
    case "update-spec":
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.id) return p;
          return {
            ...p,
            spec: action.spec,
            history: action.pushHistory ? [...p.history, p.spec].slice(-MAX_HISTORY) : p.history,
            future: action.pushHistory ? [] : p.future,
            updatedAt: Date.now(),
          };
        }),
      };
    case "update-icon":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.id ? { ...p, iconSpec: action.iconSpec, updatedAt: Date.now() } : p,
        ),
      };
    case "undo":
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.id || p.history.length === 0) return p;
          const prev = p.history[p.history.length - 1]!;
          return {
            ...p,
            spec: prev,
            history: p.history.slice(0, -1),
            future: [...p.future, p.spec],
            updatedAt: Date.now(),
          };
        }),
      };
    case "redo":
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.id || p.future.length === 0) return p;
          const next = p.future[p.future.length - 1]!;
          return {
            ...p,
            spec: next,
            history: [...p.history, p.spec].slice(-MAX_HISTORY),
            future: p.future.slice(0, -1),
            updatedAt: Date.now(),
          };
        }),
      };
    case "replace-projects":
      return { ...state, projects: action.projects };
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(exhaustive)}`);
    }
  }
}

const STORAGE_KEY = "logomaker.projects.v1";

interface StoreValue {
  state: State;
  setSession: (brief: Brief, concepts: LogoSpec[], source: "ai" | "builtin") => void;
  clearSession: () => void;
  createProject: (brief: Brief, spec: LogoSpec) => Project;
  deleteProject: (id: string) => void;
  updateSpec: (id: string, spec: LogoSpec, pushHistory?: boolean) => void;
  updateIcon: (id: string, iconSpec: AppIconSpec) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  replaceProjects: (projects: Project[]) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    hydrated: false,
    projects: [],
    session: { draftBrief: null, concepts: [], conceptSource: null },
  });
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const projects = raw ? (JSON.parse(raw) as Project[]) : [];
        dispatch({ type: "hydrate", projects });
      })
      .catch((err) => {
        console.warn("Failed to load projects:", err);
        dispatch({ type: "hydrate", projects: [] });
      });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects)).catch((err) =>
        console.warn("Failed to persist projects:", err),
      );
    }, 250);
  }, [state.projects, state.hydrated]);

  const setSession = useCallback(
    (brief: Brief, concepts: LogoSpec[], source: "ai" | "builtin") =>
      dispatch({ type: "set-session", brief, concepts, source }),
    [],
  );
  const clearSession = useCallback(() => dispatch({ type: "clear-session" }), []);

  const createProject = useCallback((brief: Brief, spec: LogoSpec): Project => {
    const project: Project = {
      id: newSpecId().replace("spec", "proj"),
      brief,
      spec,
      iconSpec: deriveIconSpec(spec),
      history: [],
      future: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: "add-project", project });
    return project;
  }, []);

  const deleteProject = useCallback((id: string) => dispatch({ type: "delete-project", id }), []);
  const updateSpec = useCallback(
    (id: string, spec: LogoSpec, pushHistory = true) =>
      dispatch({ type: "update-spec", id, spec, pushHistory }),
    [],
  );
  const updateIcon = useCallback(
    (id: string, iconSpec: AppIconSpec) => dispatch({ type: "update-icon", id, iconSpec }),
    [],
  );
  const undo = useCallback((id: string) => dispatch({ type: "undo", id }), []);
  const redo = useCallback((id: string) => dispatch({ type: "redo", id }), []);
  const replaceProjects = useCallback(
    (projects: Project[]) => dispatch({ type: "replace-projects", projects }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      setSession,
      clearSession,
      createProject,
      deleteProject,
      updateSpec,
      updateIcon,
      undo,
      redo,
      replaceProjects,
    }),
    [state, setSession, clearSession, createProject, deleteProject, updateSpec, updateIcon, undo, redo, replaceProjects],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useProject(id: string | undefined): Project | undefined {
  const { state } = useStore();
  return state.projects.find((p) => p.id === id);
}
