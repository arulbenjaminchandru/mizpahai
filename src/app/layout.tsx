import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mizpahai.vercel.app"),
  title: "TiBen AI Academy | Professional AI & Data Engineering Education",
  description:
    "TiBen AI Academy is the premier technical education platform for Data Engineering, Cloud Architecture, and Generative AI. Live cohort training with lifetime classroom access.",
  icons: {
    icon: [
      { url: "/branding/tiben-icon.svg", type: "image/svg+xml" },
      { url: "/branding/tiben-icon-square.png", type: "image/png" },
    ],
    apple: "/branding/tiben-icon-square.png",
  },
  openGraph: {
    title: "TiBen AI Academy | Professional AI & Data Engineering Education",
    description:
      "Develop practical, industry-relevant skills in artificial intelligence, generative AI, and data engineering through structured learning and hands-on projects.",
    images: [{ url: "/branding/tiben-logo-transparent.png", width: 1200, height: 400 }],
    siteName: "TiBen AI Academy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('tiben_theme') || localStorage.getItem('mizpah_theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#071527] dark:text-slate-100 font-sans selection:bg-[#0D9488] selection:text-white transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
