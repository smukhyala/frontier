"use client";

import { motion } from "motion/react";
import { BookOpen, Lightbulb, Scale, Target } from "lucide-react";

const stages = [
  {
    icon: BookOpen,
    name: "Historian",
    description: "Reconstructs project state from git history",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  {
    icon: Lightbulb,
    name: "Conjecturer",
    description: "Generates 8-12 candidate next tasks",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  {
    icon: Scale,
    name: "Guide",
    description: "Scores tasks on 7 quality dimensions",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  {
    icon: Target,
    name: "Planner",
    description: "Selects the best task with execution plan",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
];

export function PipelineVisual() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Four-stage analysis pipeline
          </h2>
          <p className="mt-3 text-muted-foreground">
            Inspired by the Conjecturer + Guide architecture from Self-Guided
            Self-Play
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.name}
              className={`relative rounded-xl border ${stage.borderColor} ${stage.bgColor} p-6`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {index < stages.length - 1 && (
                <div className="absolute -right-2 top-1/2 z-10 hidden lg:block">
                  <motion.div
                    className="text-muted-foreground/40 text-lg"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    &rarr;
                  </motion.div>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stage.bgColor}`}
                >
                  <stage.icon className={`h-5 w-5 ${stage.color}`} />
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  Stage {index + 1}
                </div>
              </div>
              <h3 className="font-semibold text-lg">{stage.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {stage.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
