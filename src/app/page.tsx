import { Hero } from "@/components/landing/hero";
import { PainPoint } from "@/components/landing/pain-point";
import { TimelineComparison } from "@/components/landing/timeline-comparison";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <PainPoint />
      <TimelineComparison />
      <HowItWorks />
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        A proof of concept built on{" "}
        <a
          href="https://arxiv.org/pdf/2604.20209"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Self-Guided Self-Play
        </a>{" "}
        (Bailey et al., 2026). Could extend to Notion, Slack, Linear.
      </footer>
    </div>
  );
}
