"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight } from "lucide-react";

export function PaperSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <motion.h2
          className="text-3xl font-bold tracking-tight text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          The math behind it
        </motion.h2>

        {/* Citation */}
        <motion.div
          className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/[0.02] px-5 py-3 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div>
            <span className="text-sm font-medium">Scaling Self-Play with Self-Guidance</span>
            <span className="text-xs text-muted-foreground ml-2">
              Bailey, Wen, Dong, Hashimoto, Ma &middot; Stanford, 2026
            </span>
          </div>
          <a href="https://arxiv.org/pdf/2604.20209" target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
              <ExternalLink className="h-3 w-3 mr-1" /> Paper
            </Badge>
          </a>
        </motion.div>

        {/* Formulas as visual cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-5 h-full">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-3">
                Conjecturer Reward
              </div>
              <div className="font-mono text-lg text-center py-2 text-foreground">
                R<sub>synth</sub> = R<sub>solve</sub> &middot; R<sub>guide</sub>
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Difficulty signal times quality signal. Zero if too easy, too hard, or degenerate.
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
          >
            <Card className="p-5 h-full">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-3">
                Guide Score
              </div>
              <div className="font-mono text-base text-center py-2 text-foreground leading-relaxed">
                max(0, rel + (2-cpx) + (1-red))
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Relevance + simplicity. Auto-zero if conclusion complexity &ge; 3.
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-5 h-full">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-3">
                Scaling Law
              </div>
              <div className="font-mono text-base text-center py-2 text-foreground leading-relaxed">
                R<sub>0</sub> + (A-R<sub>0</sub>)/(1+(C<sub>mid</sub>/C)<sup>B</sup>)
              </div>
              <div className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Sigmoidal solve rate vs compute. SGS achieves +7% asymptotic rate.
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Key results */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: "+7%", label: "Asymptotic solve rate vs RL", color: "text-emerald-400" },
            { value: "7B > 671B", label: "Small model surpasses large", color: "text-blue-400" },
            { value: "200+", label: "Rounds without collapse", color: "text-purple-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-border/30 p-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Frontier mapping - compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">
              SGS &rarr; Frontier Mapping
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { sgs: "Condition on unsolved problems", frontier: "Condition on inferred frontier" },
                { sgs: "R_guide penalizes degenerate conjectures", frontier: "7-dim scoring penalizes vague/disconnected tasks" },
                { sgs: "R_solve favors intermediate difficulty", frontier: "rightSized scoring (30-120 min range)" },
                { sgs: "Maintain Solver entropy", frontier: "Diverse task types prevent category collapse" },
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md bg-muted/20 px-3 py-2">
                  <ArrowRight className="h-3 w-3 text-primary/40 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground/50 font-mono">{row.sgs}</div>
                    <div className="text-xs text-foreground/80">{row.frontier}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
