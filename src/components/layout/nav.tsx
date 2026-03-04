"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/schedule", label: "Schedule", icon: Calendar },
];

export function Nav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-8">
        <Image src="/logo.png" alt="RunDown" width={32} height={32} className="rounded" />
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary neon-glow-pink"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <Link
            href="/api/auth/logout"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
