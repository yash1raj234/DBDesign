import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { SchemaProvider } from "@/components/SchemaProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DBDesign — Plain English to ERD Diagrams",
  description:
    "Describe your database in plain English. Get an interactive ERD diagram, SQL migrations, Prisma schema, and DBML — instantly.",
  keywords: ["database design", "ERD", "SQL generator", "Prisma", "schema designer"],
  openGraph: {
    title: "DBDesign — Plain English to ERD Diagrams",
    description: "Convert natural language to production-ready database schemas.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen bg-cream text-brown antialiased">
        <SchemaProvider>{children}</SchemaProvider>
      </body>
    </html>
  );
}
