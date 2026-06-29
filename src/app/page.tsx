import { Hero } from "@/components/landing/hero";
import { SGSComparison } from "@/components/landing/sgs-comparison";
import { PipelineVisual } from "@/components/landing/pipeline-visual";
import { PaperSection } from "@/components/landing/paper-section";
import { FeatureCards } from "@/components/landing/feature-cards";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <SGSComparison />
      <PipelineVisual />
      <PaperSection />
      <FeatureCards />
      <footer className="border-t border-border/30 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Frontier is inspired by{" "}
          <a
            href="https://arxiv.org/pdf/2604.20209"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            &ldquo;Scaling Self-Play with Self-Guidance&rdquo;
          </a>{" "}
          <span className="text-muted-foreground/60">(Bailey et al., 2026)</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground/60">
          Built to find your next task from your actual project trajectory, not
          a static roadmap.
        </p>
      </footer>
    </div>
  );
}
