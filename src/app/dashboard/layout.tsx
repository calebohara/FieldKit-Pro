import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import Header from "@/components/layout/Header";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SubscriptionProvider } from "@/lib/subscription";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
        <MobileNav />
      </div>
    </SubscriptionProvider>
  );
}
