import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Nav } from "@/components/layout/nav";

export const metadata: Metadata = {
  title: "RunDown",
  description: "Your training at a glance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background synthwave-grid-bg antialiased">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
