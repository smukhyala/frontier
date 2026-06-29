"use client";

import { motion } from "motion/react";
import { GitCommit, BarChart3, ClipboardCheck, GitBranch } from "lucide-react";

const features = [
  {
    icon: GitCommit,
    title: "Trajectory-aware",
    description:
      "Analyzes your actual commit history, not a hypothetical roadmap. Tasks are grounded in what you've actually built.",
  },
  {
    icon: BarChart3,
    title: "Multi-dimensional scoring",
    description:
      "Every candidate task is scored on trajectory fit, blocking power, information gain, clarity, and more.",
  },
  {
    icon: ClipboardCheck,
    title: "Execution-ready plans",
    description:
      "Get a concrete 30/60/90 minute execution plan you can start immediately, not a vague to-do item.",
  },
  {
    icon: GitBranch,
    title: "GitHub-native",
    description:
      "Create GitHub issues directly from recommendations. Your workflow stays in one place.",
  },
];

export function FeatureCards() {
  return (
    <section className="border-t border-border/40 bg-muted/20 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="rounded-xl border border-border/40 bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <feature.icon className="h-6 w-6 text-primary/70 mb-3" />
              <h3 className="font-semibold text-lg">{feature.title}</h3>
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
