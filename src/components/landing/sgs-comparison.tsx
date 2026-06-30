"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowDown,
  X,
  Check,
  ListTodo,
  Sparkles,
  Target,
  History,
  RotateCcw,
  Scale,
  Lightbulb,
} from "lucide-react";

export function SGSComparison() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Why not just use a regular AI planner?
          </h2>
        </motion.div>

        {/* Side by side flow diagrams */}
        <div className="grid gap-8 lg:grid-cols-2 mb-14">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-6 h-full border-red-500/10">
              <div className="text-sm font-medium text-red-400/80 mb-5">Traditional Planner</div>

              {/* Flow */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <FlowNode icon={Target} label="User writes goal" color="red" />
                <ArrowDown className="h-4 w-4 text-red-400/20" />
                <FlowNode icon={ListTodo} label="LLM decomposes" color="red" />
                <ArrowDown className="h-4 w-4 text-red-400/20" />
                <div className="w-full space-y-1.5">
                  {["Set up CI/CD pipeline", "Write test suite", "Refactor auth system", "Add documentation", "Improve error handling"].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-red-500/[0.04] border border-red-500/10 px-3 py-1.5 text-xs text-muted-foreground">
                      <X className="h-3 w-3 text-red-400/40 shrink-0" />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-red-400/50 text-center">
                No quality filter. No trajectory awareness. Generic output.
              </div>
            </Card>
          </motion.div>

          {/* Frontier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 h-full border-primary/10">
              <div className="text-sm font-medium text-primary/80 mb-5">Frontier (SGS-Inspired)</div>

              {/* Flow */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <FlowNode icon={History} label="Analyze commit history" color="blue" />
                <ArrowDown className="h-4 w-4 text-primary/20" />
                <FlowNode icon={Lightbulb} label="Conjecture 8-12 tasks" color="amber" />
                <ArrowDown className="h-4 w-4 text-primary/20" />
                <FlowNode icon={Scale} label="Guide scores & filters" color="emerald" />
                <ArrowDown className="h-4 w-4 text-primary/20" />
                <div className="w-full rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium">Add validation to GoalForm</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto border-emerald-500/20 text-emerald-400/70">
                      28/35
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-1 ml-5">
                    + 30/60/90 min execution plan
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-primary/50 text-center">
                Guide-filtered. Trajectory-grounded. One actionable task.
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Agent Loop Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <h3 className="font-semibold text-lg">Asymmetric Self-Play Loop</h3>
              <p className="text-xs text-muted-foreground mt-1">
                SGS uses three roles that improve together &mdash; Frontier adapts this for project planning
              </p>
            </div>

            {/* Visual loop diagram */}
            <div className="relative max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                {/* Solver/Historian */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center mb-3">
                    <History className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="font-medium text-sm">Solver</div>
                  <div className="text-[10px] text-blue-400 font-mono">Historian</div>
                  <div className="text-[10px] text-muted-foreground/50 mt-1">
                    Attempts problems
                  </div>
                </motion.div>

                {/* Conjecturer */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-3">
                    <Lightbulb className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="font-medium text-sm">Conjecturer</div>
                  <div className="text-[10px] text-amber-400 font-mono">Task Generator</div>
                  <div className="text-[10px] text-muted-foreground/50 mt-1">
                    Creates subproblems
                  </div>
                </motion.div>

                {/* Guide */}
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-3">
                    <Scale className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div className="font-medium text-sm">Guide</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Quality Filter</div>
                  <div className="text-[10px] text-muted-foreground/50 mt-1">
                    Prevents collapse
                  </div>
                </motion.div>
              </div>

              {/* Connection arrows */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 120">
                {/* Solver → Conjecturer */}
                <motion.path
                  d="M 70 60 Q 105 30 140 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted-foreground/15"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                />
                {/* Conjecturer → Guide */}
                <motion.path
                  d="M 165 60 Q 200 30 235 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted-foreground/15"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                />
                {/* Guide → Solver (feedback loop) */}
                <motion.path
                  d="M 235 75 Q 150 120 70 75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-primary/20"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                />
              </svg>

              {/* Loop label */}
              <motion.div
                className="flex items-center justify-center gap-2 mt-6 text-[11px] text-muted-foreground/50"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
              >
                <RotateCcw className="h-3 w-3" />
                Feedback loop prevents Conjecturer collapse (Bailey et al., Fig. 6)
              </motion.div>
            </div>

            {/* vs Symmetric */}
            <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
              <div className="rounded-lg border border-red-500/10 bg-red-500/[0.02] p-3 text-center">
                <div className="text-[10px] font-medium text-red-400/60 uppercase tracking-wide mb-1">
                  Symmetric Self-Play
                </div>
                <div className="text-[11px] text-muted-foreground/50">
                  Same agent plays both sides. No quality control. Degenerates quickly.
                </div>
              </div>
              <div className="rounded-lg border border-primary/10 bg-primary/[0.02] p-3 text-center">
                <div className="text-[10px] font-medium text-primary/60 uppercase tracking-wide mb-1">
                  Asymmetric + Guide (SGS)
                </div>
                <div className="text-[11px] text-muted-foreground/50">
                  Separate roles with Guide supervision. Sustained improvement over 200+ rounds.
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function FlowNode({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: "red" | "blue" | "amber" | "emerald";
}) {
  const colors = {
    red: "bg-red-500/10 border-red-500/15 text-red-400",
    blue: "bg-blue-400/10 border-blue-400/15 text-blue-400",
    amber: "bg-amber-400/10 border-amber-400/15 text-amber-400",
    emerald: "bg-emerald-400/10 border-emerald-400/15 text-emerald-400",
  };

  return (
    <div className={`w-full flex items-center gap-3 rounded-lg border ${colors[color]} px-4 py-2.5`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
