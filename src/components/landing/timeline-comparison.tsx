"use client";

import { motion } from "motion/react";
import { X, Check } from "lucide-react";

const genericTimeline = [
  { day: "Day 1", task: "Set up project structure", issue: "Already done 2 weeks ago" },
  { day: "Day 2", task: "Build database schema", issue: "You pivoted to a different DB" },
  { day: "Day 3", task: "Implement user authentication", issue: "Scope too large — 3 day task" },
  { day: "Day 4", task: "Create API endpoints", issue: "Which ones? No specifics" },
  { day: "Day 5", task: "Write comprehensive test suite", issue: "Half the code doesn't exist yet" },
  { day: "Day 6", task: "Add error handling", issue: "Vision changed, new priorities" },
  { day: "Day 7", task: "Deploy to production", issue: "Skips 10 steps to get there" },
];

const frontierTimeline = [
  { day: "Mon", task: "Add form validation to checkout flow", signal: "Last 3 commits touched checkout" },
  { day: "Tue", task: "Fix race condition in cart state", signal: "Bug introduced in commit abc123" },
  { day: "Wed", task: "Wire up Stripe webhook handler", signal: "Stripe SDK added but unused" },
  { day: "Thu", task: "Add loading states to payment page", signal: "UX gap after payment integration" },
  { day: "Fri", task: "Write integration test for order flow", signal: "Core flow now testable end-to-end" },
  { day: "Sat", task: "Update README with setup instructions", signal: "3 new env vars undocumented" },
  { day: "Sun", task: "Optimize cart query (N+1 detected)", signal: "Perf regression in recent PR" },
];

export function TimelineComparison() {
  return (
    <section className="py-20 px-4 border-t border-border">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground mb-8">the difference</p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Generic */}
            <div>
              <div className="text-sm font-medium text-chart-5/70 mb-4">
                Generic AI planner
              </div>
              <div className="space-y-2">
                {genericTimeline.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground/30 w-10 shrink-0 mt-0.5">
                      {item.day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <X className="h-3 w-3 text-chart-5/40 mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground/60 line-through decoration-chart-5/20">
                          {item.task}
                        </span>
                      </div>
                      <span className="text-[10px] text-chart-5/30 ml-[18px]">
                        {item.issue}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/30 mt-4">
                Stale on day one. Doesn&apos;t adapt to pivots, scope changes, or what&apos;s actually been built.
              </p>
            </div>

            {/* Frontier */}
            <div>
              <div className="text-sm font-medium text-chart-1/70 mb-4">
                Frontier
              </div>
              <div className="space-y-2">
                {frontierTimeline.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground/30 w-10 shrink-0 mt-0.5">
                      {item.day}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-chart-1/50 mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {item.task}
                        </span>
                      </div>
                      <span className="text-[10px] text-chart-1/30 ml-[18px]">
                        {item.signal}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/30 mt-4">
                Each task grounded in a specific commit. Changes daily.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
