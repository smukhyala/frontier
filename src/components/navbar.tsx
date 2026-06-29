"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserMenu } from "@/components/auth/user-menu";
import { Sparkles } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/60 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-base">Frontier</span>
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
