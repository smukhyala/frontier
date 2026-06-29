"use client";

import { motion } from "motion/react";
import { GitCommit, BarChart3, ClipboardCheck, GitBranch, Shield, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: GitCommit,
    title: "Trajectory-aware",
    description:
      "Analyzes your actual commit history, not a hypothetical roadmap. Every suggestion is grounded in what you've actually built.",
  },
  {
    icon: BarChart3,
    title: "7-dimension scoring",
    description:
      "Each candidate is scored on trajectory fit, blocking power, information gain, clarity, momentum, deadline relevance, and right-sizing.",
  },
  {
    icon: Shield,
    title: "Guide-filtered quality",
    description:
      "Like SGS's Guide reward, Frontier penalizes vague tasks, fake productivity, and oversized roadmap items disguised as actionable work.",
  },
  {
    icon: ClipboardCheck,
    title: "Execution-ready plans",
    description:
      "Get concrete 30/60/90 minute execution plans with definition of done, risks, and missing context. Start immediately.",
  },
  {
    icon: GitBranch,
    title: "GitHub-native workflow",
    description:
      "Create GitHub issues directly from recommendations. Copy plans to clipboard. Your workflow stays in one place.",
  },
  {
    icon: Zap,
    title: "Real-time pipeline",
    description:
      "Watch each stage complete in real-time via server-sent events. See your project state being reconstructed live.",
  },
];

export function FeatureCards() {
  return (
    <section className="border-t border-border/30 py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-xs border-primary/20 text-primary">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for real workflows
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group rounded-2xl border border-border/30 bg-card/50 p-6 transition-all hover:border-primary/20 hover:bg-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 mb-4 transition-colors group-hover:bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary/70" />
              </div>
              <h3 className="font-semibold text-base">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
