"use client";

import { motion } from "motion/react";
import { BookOpen, Lightbulb, Scale, Target, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stages = [
  {
    icon: BookOpen,
    name: "Historian",
    sgsRole: "State Reconstruction",
    description: "Analyzes commits, README, issues, and PRs to reconstruct what has been built and where the frontier lies.",
    outputs: ["Project summary", "Tech stack", "Active workstreams", "Inferred frontier"],
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    glowColor: "shadow-blue-500/10",
  },
  {
    icon: Lightbulb,
    name: "Conjecturer",
    sgsRole: "Problem Generation",
    description: "Generates 8-12 candidate next tasks that are local continuations of recent work.",
    outputs: ["Task descriptions", "Time estimates", "Dependencies", "Expected artifacts"],
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    glowColor: "shadow-amber-500/10",
  },
  {
    icon: Scale,
    name: "Guide",
    sgsRole: "Quality Control",
    description: "Scores each task on 7 dimensions to prevent degenerate suggestions and surface high-leverage work.",
    outputs: ["7-dim scores (0-5)", "Total score /35", "Critique", "Failure modes"],
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
    glowColor: "shadow-emerald-500/10",
  },
  {
    icon: Target,
    name: "Planner",
    sgsRole: "Execution",
    description: "Selects the best task and produces concrete 30/60/90 minute execution plans.",
    outputs: ["Selected task", "Execution steps", "Definition of done", "GitHub issue"],
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
    glowColor: "shadow-purple-500/10",
  },
];

export function PipelineVisual() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-xs border-primary/20 text-primary">
            The Pipeline
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Four stages, one recommendation
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Each stage builds on the last. The Conjecturer generates candidates.
            The Guide filters. The Planner executes.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.name}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`relative rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-6 h-full transition-shadow hover:shadow-lg ${stage.glowColor}`}
              >
                {/* Stage number */}
                <div className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border text-xs font-mono font-bold text-muted-foreground">
                  {index + 1}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stage.bgColor} border ${stage.borderColor}`}
                  >
                    <stage.icon className={`h-5 w-5 ${stage.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{stage.name}</h3>
                    <p className={`text-[10px] font-mono ${stage.color} opacity-70`}>
                      SGS: {stage.sgsRole}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {stage.description}
                </p>

                <div className="space-y-1.5">
                  {stage.outputs.map((output) => (
                    <div
                      key={output}
                      className="flex items-center gap-2 text-xs text-muted-foreground/70"
                    >
                      <div className={`h-1 w-1 rounded-full ${stage.color.replace("text-", "bg-")} opacity-50`} />
                      {output}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow between stages */}
              {index < stages.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
