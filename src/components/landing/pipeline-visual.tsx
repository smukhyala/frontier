"use client";

import { motion } from "motion/react";
import { BookOpen, Lightbulb, Scale, Target, ArrowRight } from "lucide-react";

const stages = [
  {
    icon: BookOpen,
    name: "Historian",
    what: "Reads commits, README, issues",
    output: "Project state + frontier",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    icon: Lightbulb,
    name: "Conjecturer",
    what: "Generates candidate tasks",
    output: "8-12 actionable tasks",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    icon: Scale,
    name: "Guide",
    what: "Scores on 7 dimensions",
    output: "Ranked + filtered tasks",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  {
    icon: Target,
    name: "Planner",
    what: "Picks best task",
    output: "30/60/90 min plan",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
  },
];

export function PipelineVisual() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          className="text-3xl font-bold tracking-tight text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Four stages, one task
        </motion.h2>

        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {stages.map((stage, i) => (
            <motion.div
              key={stage.name}
              className="flex items-center gap-3 flex-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={`relative flex-1 rounded-xl border ${stage.border} ${stage.bg} p-5`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <stage.icon className={`h-5 w-5 ${stage.color}`} />
                  <span className="font-semibold">{stage.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{stage.what}</div>
                <div className={`text-[10px] font-mono mt-2 ${stage.color} opacity-60`}>
                  &rarr; {stage.output}
                </div>
              </div>
              {i < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/15 shrink-0 hidden lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
