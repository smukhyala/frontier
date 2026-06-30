"use client";

import { motion } from "motion/react";
import { GitCommit, BarChart3, ClipboardCheck, GitBranch, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: GitCommit, title: "Trajectory-aware", desc: "Grounded in actual commits" },
  { icon: BarChart3, title: "7-dim scoring", desc: "Not vibes, scored metrics" },
  { icon: Shield, title: "Guide-filtered", desc: "Prevents degenerate tasks" },
  { icon: ClipboardCheck, title: "30/60/90 plans", desc: "Start immediately" },
  { icon: GitBranch, title: "GitHub-native", desc: "Issues from recommendations" },
  { icon: Zap, title: "Real-time pipeline", desc: "Watch stages complete live" },
];

const integrations = [
  { name: "GitHub", status: "live", color: "bg-emerald-400" },
  { name: "Linear", status: "planned", color: "bg-muted-foreground/30" },
  { name: "Notion", status: "planned", color: "bg-muted-foreground/30" },
  { name: "Slack", status: "planned", color: "bg-muted-foreground/30" },
  { name: "Jira", status: "planned", color: "bg-muted-foreground/30" },
  { name: "VS Code", status: "planned", color: "bg-muted-foreground/30" },
];

export function FeatureCards() {
  return (
    <section className="border-t border-border/20 py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Features grid - compact */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-xl border border-border/20 bg-card/30 p-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <f.icon className="h-5 w-5 text-primary/50 mx-auto mb-2" />
              <div className="text-xs font-medium">{f.title}</div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Integrations</h3>
              <Badge variant="secondary" className="text-[10px]">
                Same pipeline, different outputs
              </Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {integrations.map((int, i) => (
                <motion.div
                  key={int.name}
                  className="rounded-lg border border-border/20 p-3 text-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="text-sm font-medium">{int.name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${int.color}`} />
                    <span className="text-[10px] text-muted-foreground/50">{int.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/40 mt-4 text-center">
              Frontier&apos;s pipeline outputs structured data. Each integration is a different consumer of the same scored task.
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
