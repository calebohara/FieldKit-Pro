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

export type ToolPersona = "startup-tech" | "bas-integrator" | "service";

export interface ToolDefinition {
  id: string;
  href: string;
  icon: string;
  title: string;
  description: string;
}

interface ToolHubContextType {
  persona: ToolPersona;
  pinnedToolIds: string[];
  recentToolIds: string[];
  setPersona: (persona: ToolPersona) => void;
  togglePin: (toolId: string) => void;
  isPinned: (toolId: string) => boolean;
  recordToolVisit: (toolId: string) => void;
}

const STORAGE_KEY = "fieldkit-tool-hub-v1";

interface PersistedToolHub {
  persona: ToolPersona;
  pinnedToolIds: string[];
  recentToolIds: string[];
}

export const TOOL_CATALOG: ToolDefinition[] = [
  {
    id: "troubleshooting",
    href: "/dashboard/troubleshooting",
    icon: "🧭",
    title: "Drive Troubleshooter",
    description: "Guided fault-to-fix flow with targeted parameter checks",
  },
  {
    id: "reports",
    href: "/dashboard/reports",
    icon: "📝",
    title: "Job Reports",
    description: "Save findings and export/share field service summaries",
  },
  {
    id: "ppcl",
    href: "/dashboard/ppcl",
    icon: "🔧",
    title: "PPCL Tools",
    description: "Command reference, error lookup, and code analyzer",
  },
  {
    id: "loop-tuning",
    href: "/dashboard/loop-tuning",
    icon: "📊",
    title: "PID Loop Tuning",
    description: "Calculate PID values for HVAC loops",
  },
  {
    id: "abb",
    href: "/dashboard/drives/abb",
    icon: "⚡",
    title: "ABB Drives",
    description: "Fault codes, parameters, and configurations",
  },
  {
    id: "yaskawa",
    href: "/dashboard/drives/yaskawa",
    icon: "⚡",
    title: "Yaskawa Drives",
    description: "Fault codes, parameters, and setup guides",
  },
  {
    id: "psychrometrics",
    href: "/dashboard/psychrometrics",
    icon: "🌡️",
    title: "Psychrometrics",
    description: "Dewpoint, enthalpy, RH, and mixed air calculations",
  },
  {
    id: "conversions",
    href: "/dashboard/conversions",
    icon: "🔄",
    title: "Unit Conversions",
    description: "kPa/inWC, CFM/L/s, RTD tables, and signal scaling",
  },
  {
    id: "bacnet",
    href: "/dashboard/bacnet",
    icon: "🌐",
    title: "BACnet/IP Tools",
    description: "Subnet calculator, gateway checks, and ping troubleshooter",
  },
];

export function getToolIdFromPath(pathname: string): string | null {
  if (pathname.startsWith("/dashboard/troubleshooting")) return "troubleshooting";
  if (pathname.startsWith("/dashboard/reports")) return "reports";
  if (pathname.startsWith("/dashboard/ppcl")) return "ppcl";
  if (pathname.startsWith("/dashboard/loop-tuning")) return "loop-tuning";
  if (pathname.startsWith("/dashboard/drives/abb")) return "abb";
  if (pathname.startsWith("/dashboard/drives/yaskawa")) return "yaskawa";
  if (pathname.startsWith("/dashboard/psychrometrics")) return "psychrometrics";
  if (pathname.startsWith("/dashboard/conversions")) return "conversions";
  if (pathname.startsWith("/dashboard/bacnet")) return "bacnet";
  return null;
}

const ToolHubContext = createContext<ToolHubContextType>({
  persona: "startup-tech",
  pinnedToolIds: [],
  recentToolIds: [],
  setPersona: () => {},
  togglePin: () => {},
  isPinned: () => false,
  recordToolVisit: () => {},
});

export function ToolHubProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<ToolPersona>("startup-tech");
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>([]);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoaded(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PersistedToolHub;
      setPersonaState(parsed.persona ?? "startup-tech");
      setPinnedToolIds(parsed.pinnedToolIds ?? []);
      setRecentToolIds(parsed.recentToolIds ?? []);
    } catch {
      // Ignore invalid storage payloads and continue with defaults.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    const payload: PersistedToolHub = {
      persona,
      pinnedToolIds,
      recentToolIds,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [persona, pinnedToolIds, recentToolIds, loaded]);

  const setPersona = useCallback((nextPersona: ToolPersona) => {
    setPersonaState(nextPersona);
  }, []);

  const togglePin = useCallback((toolId: string) => {
    setPinnedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const isPinned = useCallback(
    (toolId: string) => pinnedToolIds.includes(toolId),
    [pinnedToolIds]
  );

  const recordToolVisit = useCallback((toolId: string) => {
    setRecentToolIds((prev) => {
      const withoutCurrent = prev.filter((id) => id !== toolId);
      return [toolId, ...withoutCurrent].slice(0, 6);
    });
  }, []);

  const value = useMemo(
    () => ({
      persona,
      pinnedToolIds,
      recentToolIds,
      setPersona,
      togglePin,
      isPinned,
      recordToolVisit,
    }),
    [persona, pinnedToolIds, recentToolIds, setPersona, togglePin, isPinned, recordToolVisit]
  );

  return (
    <ToolHubContext.Provider value={value}>{children}</ToolHubContext.Provider>
  );
}

export function useToolHub() {
  return useContext(ToolHubContext);
}
