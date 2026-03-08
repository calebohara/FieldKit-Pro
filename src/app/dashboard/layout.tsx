import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Header from "@/components/layout/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SubscriptionProvider } from "@/lib/subscription";
import { JobReportProvider } from "@/lib/job-report";
import { ToolHubProvider } from "@/lib/tool-hub";
import ToolHubRouteTracker from "@/components/dashboard/ToolHubRouteTracker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      <ToolHubProvider>
        <JobReportProvider>
          <ToolHubRouteTracker />
          {/* Mobile: app-shell with fixed header + fixed bottom nav + scrolling content */}
          {/* Desktop: sidebar + sticky header + scrolling content column */}
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="mobile-app-shell flex-1 flex flex-col min-w-0 md:ml-56 md:h-screen md:overflow-y-auto">
              <Header />
              <main className="flex-1 p-4 md:p-6 overflow-x-hidden mobile-content">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
            <MobileNav />
          </div>
        </JobReportProvider>
      </ToolHubProvider>
    </SubscriptionProvider>
  );
}
