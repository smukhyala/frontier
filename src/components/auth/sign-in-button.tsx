"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";

export function SignInButton({
  size = "default",
  className,
}: {
  size?: "default" | "lg" | "sm";
  className?: string;
}) {
  return (
    <Button
      onClick={() => signIn("github", { callbackUrl: "/repos" })}
      size={size}
      className={className}
    >
      <GitHubIcon className="mr-2 h-5 w-5" />
      Sign in with GitHub
    </Button>
  );
}
