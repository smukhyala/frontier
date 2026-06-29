import { Hero } from "@/components/landing/hero";
import { PipelineVisual } from "@/components/landing/pipeline-visual";
import { FeatureCards } from "@/components/landing/feature-cards";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <PipelineVisual />
      <FeatureCards />
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>
          Frontier is inspired by{" "}
          <span className="font-medium text-foreground">
            &ldquo;Scaling Self-Play with Self-Guidance&rdquo;
          </span>
        </p>
        <p className="mt-1">
          Built to find your next task from your actual project trajectory.
        </p>
      </footer>
    </div>
  );
}
