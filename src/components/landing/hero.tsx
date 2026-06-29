"use client";

import { motion } from "motion/react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden pt-28 pb-24">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-chart-4/8 blur-[120px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Inspired by Self-Guided Self-Play (SGS)
          </div>
        </motion.div>

        <motion.h1
          className="mt-2 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Know what to
          <br />
          <span className="bg-gradient-to-r from-primary via-chart-4 to-chart-2 bg-clip-text text-transparent">
            build next
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Static planners start from where you want to end.{" "}
          <span className="text-foreground font-medium">
            Frontier starts from where your work actually is.
          </span>{" "}
          It analyzes your commit history, infers your project frontier, and
          recommends the highest-leverage task to do right now.
        </motion.p>

        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {session?.user ? (
            <Link href="/repos">
              <Button size="lg" className="text-base px-8 h-12 rounded-xl">
                Go to Repositories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <SignInButton size="lg" className="text-base px-8 h-12 rounded-xl" />
          )}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          className="mt-16 flex items-center justify-center gap-12 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">4</div>
            <div>Pipeline Stages</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">7</div>
            <div>Scoring Dimensions</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">3</div>
            <div>Time Plans</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
