import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { supabaseConfigured } from "./config";
import { useStore, type Project } from "./store";

interface AuthValue {
  configured: boolean;
  user: User | null;
  busy: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

interface ProjectRow {
  id: string;
  data: Project;
}

/** Merge local and remote projects; the newer updatedAt wins per id. */
function mergeProjects(local: Project[], remote: Project[]): Project[] {
  const map = new Map<string, Project>();
  for (const p of [...remote, ...local]) {
    const existing = map.get(p.id);
    if (!existing || p.updatedAt > existing.updatedAt) map.set(p.id, p);
  }
  return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, replaceProjects } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) initialSyncDone.current = false;
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const fullSync = useCallback(
    async (userId: string, localProjects: Project[]) => {
      if (!supabase) return;
      const { data, error: fetchError } = await supabase
        .from("projects")
        .select("id, data")
        .eq("user_id", userId);
      if (fetchError) {
        console.warn("Project sync failed:", fetchError.message);
        return;
      }
      const remote = ((data ?? []) as ProjectRow[]).map((r) => r.data);
      const merged = mergeProjects(localProjects, remote);
      replaceProjects(merged);
      const { error: upsertError } = await supabase.from("projects").upsert(
        merged.map((p) => ({
          id: p.id,
          user_id: userId,
          data: p,
          updated_at: new Date(p.updatedAt).toISOString(),
        })),
      );
      if (upsertError) console.warn("Project push failed:", upsertError.message);
    },
    [replaceProjects],
  );

  // Guest-mode merge: when a user signs in, reconcile local and cloud
  // projects once, then keep pushing changes while signed in.
  useEffect(() => {
    if (!supabase || !user || !state.hydrated) return;
    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      void fullSync(user.id, state.projects);
      return;
    }
    const client = supabase;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void client
        .from("projects")
        .upsert(
          state.projects.map((p) => ({
            id: p.id,
            user_id: user.id,
            data: p,
            updated_at: new Date(p.updatedAt).toISOString(),
          })),
        )
        .then(({ error: e }) => {
          if (e) console.warn("Project push failed:", e.message);
        });
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.projects, state.hydrated, fullSync]);

  const run = useCallback(async (fn: () => Promise<{ error: { message: string } | null }>) => {
    if (!supabase) return false;
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await fn();
      if (e) {
        setError(e.message);
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(
    (email: string, password: string) =>
      run(() => supabase!.auth.signInWithPassword({ email, password })),
    [run],
  );
  const signUp = useCallback(
    (email: string, password: string) => run(() => supabase!.auth.signUp({ email, password })),
    [run],
  );
  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ configured: supabaseConfigured, user, busy, error, signIn, signUp, signOut }),
    [user, busy, error, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
