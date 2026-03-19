import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { shadesOfPurple, neobrutalism } from "@clerk/ui/themes";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CourierHub - Fast & Reliable Courier Service",
  description: "Track shipments, manage deliveries, and send packages with CourierHub's reliable courier service.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme cookie server-side to avoid flash of wrong theme
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  const isDark = theme === "dark";

  return (
    <ClerkProvider
      appearance={{
        theme: isDark ? shadesOfPurple : neobrutalism,
      }}
    >
      <html lang="en" className={isDark ? "dark" : ""}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
