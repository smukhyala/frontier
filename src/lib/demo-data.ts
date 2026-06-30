import type { ProjectState, ScoredTask, FrontierRecommendation } from "./schemas";

export const demoProjectState: ProjectState & { _commits: { sha: string; message: string; author: string; date: string; filesChanged: string[] }[]; _fileActivity: { topFiles: { path: string; editCount: number; firstSeen: string; lastEdited: string }[]; areas: { area: string; editCount: number; fileCount: number; recentFiles: string[] }[]; hotspots: string[] } } = {
  summary: "An e-commerce platform built with Next.js and Stripe. Core product catalog and cart functionality are implemented. Payment integration was recently started — Stripe SDK added but webhook handling is incomplete. The checkout flow UI exists but lacks form validation and error states.",
  recentTrajectory: [
    "Added Stripe SDK and payment intent creation",
    "Built checkout page UI with form fields",
    "Implemented cart state management with useCart hook",
    "Created product listing page with filters",
    "Set up database schema for orders and products",
  ],
  completedCapabilities: [
    "Product catalog with search and filtering",
    "Shopping cart with add/remove/quantity",
    "User authentication via NextAuth",
    "Database schema for products, orders, users",
    "Responsive layout with Tailwind",
  ],
  activeWorkstreams: [
    "Stripe payment integration",
    "Checkout flow completion",
    "Order confirmation emails",
  ],
  likelyMissingPieces: [
    "No webhook handler for payment confirmations",
    "No form validation on checkout",
    "No order history page",
    "No error states in payment flow",
    "No tests for cart or payment logic",
  ],
  blockers: [
    "Stripe webhook endpoint not implemented — payments can't be confirmed",
  ],
  uncertainty: [
    "Unclear if email service is configured",
    "No CI/CD pipeline visible",
  ],
  inferredFrontier: "Payment integration is half-complete: Stripe SDK is wired for creating payment intents, but there's no server-side confirmation via webhooks. The checkout UI exists but has no validation. The natural next step is completing the payment loop before moving to order history or emails.",
  techStack: ["Next.js", "TypeScript", "Tailwind", "Stripe", "Prisma", "PostgreSQL", "NextAuth"],
  momentum: "active" as const,
  _commits: [
    { sha: "a3f1c2d", message: "Add Stripe SDK and payment intent creation", author: "dev", date: "2026-06-28T14:30:00Z", filesChanged: ["src/lib/stripe.ts", "package.json", "src/app/api/payment/route.ts"] },
    { sha: "b7e4d1a", message: "Build checkout page with form fields", author: "dev", date: "2026-06-28T10:15:00Z", filesChanged: ["src/app/checkout/page.tsx", "src/components/checkout/checkout-form.tsx"] },
    { sha: "c9d2f3b", message: "Add cart state management hook", author: "dev", date: "2026-06-27T16:45:00Z", filesChanged: ["src/hooks/useCart.ts", "src/context/cart-context.tsx"] },
    { sha: "d4e5a6c", message: "Fix product card layout on mobile", author: "dev", date: "2026-06-27T11:20:00Z", filesChanged: ["src/components/product/product-card.tsx"] },
    { sha: "e1f2b3d", message: "Add product filtering by category", author: "dev", date: "2026-06-26T15:00:00Z", filesChanged: ["src/app/products/page.tsx", "src/components/product/filter-bar.tsx"] },
    { sha: "f5a6c7e", message: "Set up Prisma schema for orders", author: "dev", date: "2026-06-26T09:30:00Z", filesChanged: ["prisma/schema.prisma", "src/lib/db.ts"] },
    { sha: "a8b9d0f", message: "Implement NextAuth with GitHub provider", author: "dev", date: "2026-06-25T14:00:00Z", filesChanged: ["src/lib/auth.ts", "src/app/api/auth/[...nextauth]/route.ts"] },
    { sha: "b2c3e4a", message: "Create product seed script", author: "dev", date: "2026-06-25T10:00:00Z", filesChanged: ["prisma/seed.ts"] },
  ],
  _fileActivity: {
    topFiles: [
      { path: "src/lib/stripe.ts", editCount: 4, firstSeen: "2026-06-26", lastEdited: "2026-06-28" },
      { path: "src/app/checkout/page.tsx", editCount: 3, firstSeen: "2026-06-27", lastEdited: "2026-06-28" },
      { path: "src/hooks/useCart.ts", editCount: 3, firstSeen: "2026-06-26", lastEdited: "2026-06-27" },
      { path: "prisma/schema.prisma", editCount: 2, firstSeen: "2026-06-25", lastEdited: "2026-06-26" },
    ],
    areas: [
      { area: "src/app", editCount: 8, fileCount: 5, recentFiles: ["src/app/checkout/page.tsx"] },
      { area: "src/components", editCount: 5, fileCount: 4, recentFiles: [] },
      { area: "src/lib", editCount: 4, fileCount: 3, recentFiles: ["src/lib/stripe.ts"] },
    ],
    hotspots: ["src/lib/stripe.ts", "src/app/checkout/page.tsx", "src/hooks/useCart.ts"],
  },
};

export const demoScoredTasks: ScoredTask[] = [
  {
    id: "task-1", title: "Wire up Stripe webhook endpoint", description: "Create POST /api/webhooks/stripe to handle payment confirmations and update order status.",
    taskType: "implementation", estimatedMinutes: 60,
    whyNow: "Stripe SDK added in commit a3f1c2d but no webhook handler exists — payments can't be confirmed.",
    evidenceChain: [
      { type: "commit", detail: "Commit a3f1c2d added stripe.ts with createPaymentIntent but no webhook verification" },
      { type: "file", detail: "src/app/api/ has no webhooks directory — server can't receive Stripe events" },
      { type: "gap", detail: "Checkout creates payment intents but has no way to confirm success/failure" },
    ],
    expectedArtifact: "Working webhook endpoint with signature verification",
    dependencies: ["Stripe webhook secret configured"],
    scores: { trajectoryFit: 5, deadlineRelevance: 4, blockingPower: 5, informationGain: 3, taskClarity: 5, rightSized: 4, momentum: 5 },
    totalScore: 31, critique: "Depends on Stripe webhook secret being configured in env.", failureMode: "Webhook signature verification is tricky to test locally.",
  },
  {
    id: "task-2", title: "Add checkout form validation", description: "Add Zod validation to the checkout form for email, address, and card fields.",
    taskType: "implementation", estimatedMinutes: 45,
    whyNow: "Checkout form in commit b7e4d1a has input fields but no validation.",
    evidenceChain: [
      { type: "commit", detail: "Commit b7e4d1a built checkout-form.tsx with uncontrolled inputs" },
      { type: "file", detail: "src/components/checkout/checkout-form.tsx has no validation logic" },
      { type: "code_comment", detail: "TODO in checkout-form.tsx: 'add validation'" },
    ],
    expectedArtifact: "Form validates before submission with error messages",
    dependencies: [],
    scores: { trajectoryFit: 4, deadlineRelevance: 4, blockingPower: 3, informationGain: 2, taskClarity: 5, rightSized: 5, momentum: 4 },
    totalScore: 27, critique: "Low information gain — straightforward validation work.", failureMode: "Might over-engineer validation instead of keeping it simple.",
  },
  {
    id: "task-3", title: "Fix cart race condition on rapid clicks", description: "Add debounce to useCart hook to prevent duplicate items when adding quickly.",
    taskType: "debugging", estimatedMinutes: 30,
    whyNow: "useCart hook in commit c9d2f3b uses setState without mutation guards.",
    evidenceChain: [
      { type: "commit", detail: "Commit c9d2f3b added useCart.ts with direct setState calls" },
      { type: "file", detail: "src/hooks/useCart.ts has no debounce, optimistic update, or mutex" },
      { type: "gap", detail: "Multiple rapid add-to-cart clicks create duplicate entries" },
    ],
    expectedArtifact: "Cart handles concurrent updates atomically",
    dependencies: [],
    scores: { trajectoryFit: 4, deadlineRelevance: 3, blockingPower: 2, informationGain: 2, taskClarity: 5, rightSized: 5, momentum: 3 },
    totalScore: 24, critique: "Low blocking power — other work doesn't depend on this.", failureMode: "Could be a non-issue if users rarely double-click.",
  },
  {
    id: "task-4", title: "Add payment error states to checkout", description: "Show error messages when payment fails or card is declined.",
    taskType: "implementation", estimatedMinutes: 40,
    whyNow: "Checkout page handles success but silently fails on errors.",
    evidenceChain: [
      { type: "file", detail: "src/app/checkout/page.tsx has try/catch but empty catch block" },
      { type: "gap", detail: "No user-visible feedback on payment failure" },
    ],
    expectedArtifact: "Error toast or inline message on payment failure",
    dependencies: ["Webhook endpoint for confirming payment status"],
    scores: { trajectoryFit: 4, deadlineRelevance: 4, blockingPower: 2, informationGain: 2, taskClarity: 4, rightSized: 5, momentum: 4 },
    totalScore: 25, critique: "Depends on webhook being done first for full error flow.", failureMode: "Edge cases around different Stripe error types.",
  },
];

export const demoRecommendation: FrontierRecommendation = {
  selectedTaskId: "task-1",
  reasoning: "The Stripe webhook endpoint is the highest-leverage task because it unblocks the entire payment confirmation flow. Without it, the checkout UI works but payments can't be verified — orders would go untracked. Every other payment-related task (error states, order history, emails) depends on this being done first.",
  goalConnection: "Completing the webhook closes the payment loop, which is the critical path for launching the MVP.",
  genericAlternative: "A generic planner would suggest 'write comprehensive test suite' — but half the payment flow doesn't exist yet, so tests would be testing incomplete code.",
  executionPlan: {
    thirtyMinuteVersion: [
      "Create src/app/api/webhooks/stripe/route.ts",
      "Add Stripe webhook signature verification",
      "Handle checkout.session.completed event",
      "Update order status in database",
    ],
    sixtyMinuteVersion: [
      "Create src/app/api/webhooks/stripe/route.ts",
      "Add Stripe webhook signature verification",
      "Handle checkout.session.completed event",
      "Handle payment_intent.payment_failed event",
      "Update order status in database",
      "Add Stripe CLI for local webhook testing",
      "Test with stripe trigger checkout.session.completed",
    ],
    ninetyMinuteVersion: [
      "Create src/app/api/webhooks/stripe/route.ts",
      "Add Stripe webhook signature verification",
      "Handle checkout.session.completed event",
      "Handle payment_intent.payment_failed event",
      "Handle refund events",
      "Update order status in database",
      "Add Stripe CLI for local webhook testing",
      "Write integration test for webhook flow",
      "Add webhook endpoint to README setup instructions",
    ],
  },
  definitionOfDone: [
    "Webhook receives and verifies Stripe events",
    "Order status updates on payment success",
    "Payment failures are logged",
    "Local testing works with Stripe CLI",
  ],
  risks: [
    "Stripe webhook secret must be configured",
    "Local testing requires Stripe CLI setup",
    "Idempotency — same event delivered twice",
  ],
  missingContext: [
    "Which Stripe events to handle beyond checkout",
    "Whether order emails should trigger from webhook",
  ],
  suggestedGitHubIssue: {
    title: "Implement Stripe webhook endpoint for payment confirmation",
    body: "## Context\nStripe SDK is wired for creating payment intents but there's no server-side confirmation.\n\n## Task\nCreate POST /api/webhooks/stripe with signature verification and order status updates.\n\n## Acceptance Criteria\n- [ ] Webhook verifies Stripe signatures\n- [ ] checkout.session.completed updates order to 'paid'\n- [ ] payment_intent.payment_failed logs the error\n- [ ] Works locally with Stripe CLI",
    labels: ["implementation", "payments", "high-priority"],
  },
};
