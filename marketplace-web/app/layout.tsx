import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ONXZA Skills Marketplace",
  description: "Discover and install ONXZA skills for your AI workflows.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-onxza-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-white">
          ONXZA <span className="text-onxza-blue">Skills</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-400">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/search" className="transition-colors hover:text-white">
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-xs text-gray-500 leading-relaxed">
        <p>
          Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI
          Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products.
          Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="flex-1">
          <Suspense>{children}</Suspense>
        </main>
        <Footer />
      </body>
    </html>
  );
}
