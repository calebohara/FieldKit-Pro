import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldKit Pro — Field Engineering Toolkit for Controls Engineers",
  description:
    "Look up ABB & Yaskawa drive fault codes, tune PID loops, and troubleshoot PPCL — all from your phone. Built by a controls engineer, for controls engineers.",
  keywords: [
    "HVAC controls",
    "building automation",
    "ABB drive fault codes",
    "Yaskawa drive fault codes",
    "PID loop tuning",
    "PPCL programming",
    "field engineering",
    "BAS troubleshooting",
    "ACS580",
    "GA500",
    "GA700",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "FieldKit Pro — Your Field Engineering Toolkit",
    description:
      "Drive fault codes, PID tuning, PPCL reference — searchable in seconds from your phone. Free to start.",
    type: "website",
    siteName: "FieldKit Pro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FieldKit Pro — Field Engineering Toolkit for Controls Engineers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FieldKit Pro — Field Engineering Toolkit",
    description:
      "ABB & Yaskawa fault codes, PID loop tuning, PPCL troubleshooting — built for controls engineers.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FieldKit Pro",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
