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
    <section className="relative overflow-hidden pt-24 pb-20">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            Inspired by Self-Guided Self-Play
          </div>
        </motion.div>

        <motion.h1
          className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Find the next task from your{" "}
          <span className="bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
            actual trajectory
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Static planners start from where you want to end. Frontier starts from
          where your work actually is. It analyzes your commit history, infers
          your project frontier, and recommends the single highest-leverage task
          to do next.
        </motion.p>

        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {session?.user ? (
            <Link href="/repos">
              <Button size="lg" className="text-base px-8">
                Go to Repositories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <SignInButton size="lg" className="text-base px-8" />
          )}
        </motion.div>
      </div>
    </section>
  );
}
