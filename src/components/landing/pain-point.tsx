"use client";

import { motion } from "motion/react";

const problems = [
  {
    quote: "Set up CI/CD and write comprehensive tests.",
    reply: "You did that two weeks ago. It doesn't know.",
    color: "border-chart-5/40",
  },
  {
    quote: "Refactor the authentication system.",
    reply: "You're three days from a demo. Wrong time.",
    color: "border-chart-5/40",
  },
  {
    quote: "Improve error handling across the codebase.",
    reply: "Where? Which errors? It can't say.",
    color: "border-chart-5/40",
  },
  {
    quote: "Add documentation for all API endpoints.",
    reply: "Half your endpoints don't exist yet.",
    color: "border-chart-5/40",
  },
];

export function PainPoint() {
  return (
    <section className="py-24 px-4 border-t border-border">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-muted-foreground mb-8">the problem</p>

          <h2 className="text-2xl font-medium tracking-tight mb-4 leading-snug">
            Your AI planner suggests tasks it would give
            to any project. It hasn&apos;t read your commits.
          </h2>

          <p className="text-muted-foreground mb-10 leading-relaxed">
            It decomposes goals top-down. It doesn&apos;t know your deadline, your
            trajectory, or what actually unblocks progress.
          </p>

          <div className="space-y-5">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                className={`border-l-2 ${p.color} pl-5 py-1`}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <p className="text-base leading-relaxed">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.reply}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 border-l-2 border-chart-1/60 pl-5 py-1"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-base">
              Frontier reads your last 30 commits and works forward.
            </p>
            <p className="text-sm text-chart-1 mt-1">
              The task it suggests changes every time you push.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
