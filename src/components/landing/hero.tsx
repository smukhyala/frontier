"use client";

import { motion } from "motion/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="pt-32 pb-24 px-4">
      <div className="mx-auto max-w-2xl">
        <motion.p
          className="text-sm text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          frontier
        </motion.p>

        <motion.h1
          className="text-4xl sm:text-5xl font-medium tracking-tight leading-[1.1]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Your AI planner doesn&apos;t know
          what you&apos;ve already built.
        </motion.h1>

        <motion.p
          className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Frontier reads your commit history and finds the single
          highest-leverage task to do right now. Not from a roadmap.
          From your actual work.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6 h-10 text-sm">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <SignInButton size="default" className="rounded-full px-6 h-10 text-sm" />
            )}
            <Link
              href="/demo"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See a demo &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
