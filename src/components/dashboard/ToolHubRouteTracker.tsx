"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getToolIdFromPath, useToolHub } from "@/lib/tool-hub";

export default function ToolHubRouteTracker() {
  const pathname = usePathname();
  const { recordToolVisit } = useToolHub();

  useEffect(() => {
    const toolId = getToolIdFromPath(pathname);
    if (!toolId) return;
    recordToolVisit(toolId);
  }, [pathname, recordToolVisit]);

  return null;
}
