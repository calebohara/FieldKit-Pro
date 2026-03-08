"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export interface StorageStatus {
  sizeBytes: number;
  sizeLabel: string;
  entryCount: number;
  lastSavedAt: string | null;
}

interface JobReportContextType {
  meta: JobReportMeta;
  entries: JobReportEntry[];
  storageStatus: StorageStatus;
  updateMeta: (patch: Partial<JobReportMeta>) => void;
  addEntry: (entry: Omit<JobReportEntry, "id" | "createdAt">) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
  setEntries: (entries: JobReportEntry[]) => void;
}

const STORAGE_KEY = "fieldkit-job-report-v1";
const SCHEMA_VERSION = 1;
const SAVE_DEBOUNCE_MS = 400;

const defaultMeta: JobReportMeta = {
  reportTitle: "Field Tech Report",
  siteName: "",
  equipment: "",
  technician: "",
};

const defaultStorageStatus: StorageStatus = {
  sizeBytes: 0,
  sizeLabel: "0 B",
  entryCount: 0,
  lastSavedAt: null,
};

const JobReportContext = createContext<JobReportContextType>({
  meta: defaultMeta,
  entries: [],
  storageStatus: defaultStorageStatus,
  updateMeta: () => {},
  addEntry: () => {},
  removeEntry: () => {},
  clearAll: () => {},
  setEntries: () => {},
});

interface PersistedJobReport {
  _schemaVersion?: number;
  meta: JobReportMeta;
  entries: JobReportEntry[];
}

function buildId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function migratePayload(raw: unknown): PersistedJobReport | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Current schema or legacy (no version field) — both have meta + entries
  if (obj.meta && obj.entries && Array.isArray(obj.entries)) {
    return {
      _schemaVersion: SCHEMA_VERSION,
      meta: obj.meta as JobReportMeta,
      entries: obj.entries as JobReportEntry[],
    };
  }
  return null;
}

export function JobReportProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<JobReportMeta>(defaultMeta);
  const [entries, setEntries] = useState<JobReportEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(defaultStorageStatus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const migrated = migratePayload(parsed);
      if (migrated) {
        setMeta(migrated.meta);
        setEntries(migrated.entries);
        setStorageStatus({
          sizeBytes: new Blob([raw]).size,
          sizeLabel: formatBytes(new Blob([raw]).size),
          entryCount: migrated.entries.length,
          lastSavedAt: new Date().toISOString(),
        });
      } else {
        // Corrupted data — clear it and start fresh
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Corrupted JSON — clear and start fresh
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const payload: PersistedJobReport = {
        _schemaVersion: SCHEMA_VERSION,
        meta,
        entries,
      };
      try {
        const json = JSON.stringify(payload);
        window.localStorage.setItem(STORAGE_KEY, json);
        const size = new Blob([json]).size;
        setStorageStatus({
          sizeBytes: size,
          sizeLabel: formatBytes(size),
          entryCount: entries.length,
          lastSavedAt: new Date().toISOString(),
        });
      } catch {
        // Quota exceeded or other write error — state remains in memory
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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

  const clearAll = useCallback(() => {
    setMeta(defaultMeta);
    setEntries([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      setStorageStatus(defaultStorageStatus);
    }
  }, []);

  const value = useMemo(
    () => ({
      meta,
      entries,
      storageStatus,
      updateMeta,
      addEntry,
      removeEntry,
      clearAll,
      setEntries,
    }),
    [meta, entries, storageStatus, updateMeta, addEntry, removeEntry, clearAll]
  );

  return (
    <JobReportContext.Provider value={value}>{children}</JobReportContext.Provider>
  );
}

export function useJobReport() {
  return useContext(JobReportContext);
}
