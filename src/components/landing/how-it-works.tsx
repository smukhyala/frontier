"use client";

import { motion } from "motion/react";

const steps = [
  { n: "01", title: "Historian", desc: "Reads commits, README, issues. Reconstructs what exists." },
  { n: "02", title: "Conjecturer", desc: "Generates 8-12 candidate next tasks from the frontier." },
  { n: "03", title: "Guide", desc: "Scores each task. Filters vague, disconnected, oversized work." },
  { n: "04", title: "Planner", desc: "Picks the best one. Gives you a 30/60/90 minute plan." },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 border-t border-border">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground mb-8">how it works</p>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                className="flex gap-4"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <span className="text-xs font-mono text-muted-foreground/60 mt-1 w-6 shrink-0">
                  {step.n}
                </span>
                <div>
                  <span className="font-medium">{step.title}</span>
                  <span className="text-muted-foreground ml-2">{step.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              proof of concept
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Currently works with GitHub. The pipeline outputs structured data that
              could feed into Notion pages, Slack updates, Linear tickets, or daily
              standup summaries. This is a starting point.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
