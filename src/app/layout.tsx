import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIGHT CLUB",
  description: "Anonymous. Brutal. Gym Tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col relative">
            {/* Scanlines or noise could go here */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

