"use client";

import { motion } from "motion/react";

export function PaperContent() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Title */}
        <p className="text-sm text-muted-foreground mb-4">the paper</p>
        <h1 className="text-2xl font-medium tracking-tight mb-2">
          Scaling Self-Play with Self-Guidance
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          Bailey, Wen, Dong, Hashimoto, Ma &middot; Stanford &middot; 2026
        </p>
        <a
          href="https://arxiv.org/pdf/2604.20209"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-chart-1 hover:underline"
        >
          arxiv.org/pdf/2604.20209 &rarr;
        </a>

        {/* Core idea */}
        <section className="mt-12">
          <p className="text-sm text-muted-foreground mb-4">core idea</p>
          <p className="leading-relaxed mb-4">
            In self-play, a <strong>Conjecturer</strong> creates problems for a{" "}
            <strong>Solver</strong>. In theory, both improve forever. In practice,
            the Conjecturer learns to game its reward &mdash; producing artificially
            complex problems that don&apos;t help.
          </p>
          <p className="leading-relaxed">
            SGS adds a third role: the <strong>Guide</strong>. It scores synthetic
            problems for relevance and clarity, keeping the Conjecturer honest.
          </p>
        </section>

        {/* The loop */}
        <section className="mt-12">
          <p className="text-sm text-muted-foreground mb-6">the agent loop</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { role: "Solver", does: "Attempts problems", color: "border-chart-1" },
              { role: "Conjecturer", does: "Creates subproblems", color: "border-chart-3" },
              { role: "Guide", does: "Scores quality", color: "border-chart-4" },
            ].map((r) => (
              <div key={r.role} className={`border-t-2 ${r.color} pt-3`}>
                <div className="font-medium text-sm">{r.role}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.does}</div>
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed">
            The Solver and Conjecturer improve together. The Guide prevents collapse.
            This is <strong className="text-foreground">asymmetric</strong>-self-play &mdash;
            each role has a different objective. Symmetric self-play (same agent, both sides)
            degenerates quickly because there&apos;s no quality pressure.
          </div>
        </section>

        {/* Reward */}
        <section className="mt-12">
          <p className="text-sm text-muted-foreground mb-4">reward function</p>

          <div className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 font-mono text-center text-sm">
              R<sub>synth</sub> = R<sub>solve</sub> &middot; R<sub>guide</sub>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-mono text-xs text-chart-1 mb-1">R_solve</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Zero if unsolvable or too easy (top 30%).
                  Otherwise <span className="font-mono">1 - solve_rate</span>.
                  Harder problems within solvable range get more reward.
                </p>
              </div>
              <div>
                <div className="font-mono text-xs text-chart-4 mb-1">R_guide</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  LLM scores relevance to target + formulation clarity.
                  Auto-zero if conclusion is overly complex.
                  Prevents degenerate conjectures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Guide formula */}
        <section className="mt-12">
          <p className="text-sm text-muted-foreground mb-4">guide scoring</p>

          <div className="bg-secondary rounded-lg p-4 font-mono text-center text-sm mb-4">
            R<sub>guide</sub> = max(0, relevance + (2 &minus; complexity) + (1 &minus; redundancy))
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            If conclusion complexity &ge; 3, score is automatically 0.
            Without this, the Conjecturer collapses to producing statements
            with long disjunctive conclusions &mdash; 80%+ by iteration 100 (Fig. 2).
          </p>
        </section>

        {/* Scaling */}
        <section className="mt-12">
          <p className="text-sm text-muted-foreground mb-4">scaling law</p>

          <div className="bg-secondary rounded-lg p-4 font-mono text-center text-sm mb-4">
            R<sub>C</sub> = R<sub>0</sub> + (A &minus; R<sub>0</sub>) / (1 + (C<sub>mid</sub>/C)<sup>B</sup>)
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Cumulative solve rate follows a sigmoidal curve vs compute.
            A is the asymptotic rate. SGS shifts A higher.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "+7%", label: "asymptotic solve rate vs best RL" },
              { value: "7B > 671B", label: "small model beats large at pass@4" },
              { value: "200+", label: "rounds without collapse" },
            ].map((s, i) => (
              <div key={i} className="border-t border-border pt-3">
                <div className="font-medium">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How Frontier uses this */}
        <section className="mt-12 pb-8">
          <p className="text-sm text-muted-foreground mb-4">how frontier applies this</p>

          <div className="space-y-3">
            {[
              ["Solver &rarr; Historian", "Reconstructs project state from git data"],
              ["Conjecturer &rarr; Conjecturer", "Generates candidate tasks conditioned on frontier"],
              ["R_guide &rarr; Guide", "7-dimension scoring filters degenerate suggestions"],
              ["R_solve &rarr; rightSized", "Tasks must be 30-120 min, not trivial or massive"],
              ["Entropy maintenance &rarr; type diversity", "Mix of impl, debug, test, docs prevents collapse"],
            ].map(([mapping, desc], i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span
                  className="font-mono text-xs text-muted-foreground w-48 shrink-0 mt-0.5"
                  dangerouslySetInnerHTML={{ __html: mapping }}
                />
                <span className="text-foreground/80">{desc}</span>
              </div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
