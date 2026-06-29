"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserMenu } from "@/components/auth/user-menu";
import { Compass } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Compass className="h-5 w-5 text-primary" />
          <span className="text-lg">Frontier</span>
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <Link
                href="/repos"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Repositories
              </Link>
              <UserMenu />
            </>
          ) : (
            <SignInButton size="sm" />
          )}
        </div>
      </div>
    </nav>
  );
}
