import type { Metadata } from "next";
import ToolHubHome from "@/components/dashboard/ToolHubHome";

export const metadata: Metadata = {
  title: "Dashboard — FieldKit Pro",
};

export default function DashboardPage() {
  return <ToolHubHome />;
}
