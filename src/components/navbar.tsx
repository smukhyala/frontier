"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserMenu } from "@/components/auth/user-menu";

const navLinks = [
  { href: "/demo", label: "Demo" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/evaluate", label: "Evaluate" },
  { href: "/paper", label: "Paper" },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium tracking-tight">
            frontier
          </Link>
          <div className="flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs transition-colors ${
                  pathname.startsWith(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          {session?.user ? (
            <UserMenu />
          ) : (
            <SignInButton size="sm" className="rounded-full h-7 text-xs px-4" />
          )}
        </div>
      </div>
    </nav>
  );
}
