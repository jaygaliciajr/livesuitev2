import type { Metadata, Viewport } from "next";
import { Poppins, Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/settings/theme-provider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Live Selling Fast Encoding",
  description: "Mobile-first live selling encoder app",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${poppins.variable} antialiased`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              classNames: {
                toast: "surface-card rounded-2xl border border-border text-foreground",
                title: "text-sm font-semibold text-foreground",
                description: "text-xs text-muted",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
