"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type JobReportEntryType = "fault" | "parameter-change" | "pid" | "note";

export interface JobReportEntry {
  id: string;
  type: JobReportEntryType;
  createdAt: string;
  title: string;
  summary?: string;
  source?: string;
  fields?: Record<string, string>;
}

export interface JobReportMeta {
  reportTitle: string;
  siteName: string;
  equipment: string;
  technician: string;
}

interface JobReportContextType {
  meta: JobReportMeta;
  entries: JobReportEntry[];
  updateMeta: (patch: Partial<JobReportMeta>) => void;
  addEntry: (entry: Omit<JobReportEntry, "id" | "createdAt">) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
  setEntries: (entries: JobReportEntry[]) => void;
}

const STORAGE_KEY = "fieldkit-job-report-v1";

const defaultMeta: JobReportMeta = {
  reportTitle: "Field Service Report",
  siteName: "",
  equipment: "",
  technician: "",
};

const JobReportContext = createContext<JobReportContextType>({
  meta: defaultMeta,
  entries: [],
  updateMeta: () => {},
  addEntry: () => {},
  removeEntry: () => {},
  clearEntries: () => {},
  setEntries: () => {},
});

interface PersistedJobReport {
  meta: JobReportMeta;
  entries: JobReportEntry[];
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function JobReportProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<JobReportMeta>(defaultMeta);
  const [entries, setEntries] = useState<JobReportEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PersistedJobReport;
      setMeta(parsed.meta ?? defaultMeta);
      setEntries(parsed.entries ?? []);
    } catch {
      // Ignore invalid local storage payloads and continue with defaults.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    const payload: PersistedJobReport = { meta, entries };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [meta, entries, loaded]);

  const updateMeta = useCallback((patch: Partial<JobReportMeta>) => {
    setMeta((prev) => ({ ...prev, ...patch }));
  }, []);

  const addEntry = useCallback((entry: Omit<JobReportEntry, "id" | "createdAt">) => {
    setEntries((prev) => [
      {
        ...entry,
        id: buildId(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const value = useMemo(
    () => ({
      meta,
      entries,
      updateMeta,
      addEntry,
      removeEntry,
      clearEntries,
      setEntries,
    }),
    [meta, entries, updateMeta, addEntry, removeEntry, clearEntries]
  );

  return (
    <JobReportContext.Provider value={value}>{children}</JobReportContext.Provider>
  );
}

export function useJobReport() {
  return useContext(JobReportContext);
}
