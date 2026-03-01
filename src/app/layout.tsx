import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldKit Pro — Field Engineering Toolkit",
  description:
    "PPCL troubleshooting, loop tuning, drive configuration — all the references you need, searchable in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
