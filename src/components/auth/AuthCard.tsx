import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

type AuthMode = "sign-in" | "sign-up";

export const AuthCard = ({ className = "" }: { className?: string }) => {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const tabClassName = (isActive: boolean) =>
    `cursor-pointer border-0 border-b-2 bg-transparent px-0 pb-1.5 pt-0 font-mono text-xs tracking-[0.02em] text-[var(--color-foreground)] transition-[opacity,border-color] duration-150 hover:opacity-80 ${isActive
      ? "border-[var(--color-foreground)] opacity-100"
      : "border-transparent opacity-50"
    }`;

  const ctaClassName =
    "w-full cursor-pointer border border-[var(--color-foreground)] bg-[var(--color-foreground)] px-4 py-2.5 font-mono text-xs tracking-[0.02em] text-[var(--color-background)] shadow-[2px_2px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

  return (
    <section
      className={cn("box-border w-full max-w-[420px] max-[980px]:max-w-none", className)}
      aria-label="Authentication form"
    >
      <div className="border border-[var(--color-foreground)] bg-[var(--color-background)] p-[clamp(1.2rem,2.5vw,1.8rem)] shadow-[3px_3px_0px_var(--color-foreground)]">
        {/* Decorative accent */}
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-block h-2 w-2 border border-[var(--color-foreground)] bg-[var(--color-foreground)]" />
          <span className="inline-block h-2 w-2 border border-[var(--color-foreground)]" />
          <span className="inline-block h-2 w-2 border border-[var(--color-foreground)]" />
        </div>

        {/* Header */}
        <h2 className="m-0 font-mono text-base font-bold tracking-[-0.02em]">
          {mode === "sign-in" ? "Welcome back" : "Get started"}
        </h2>
        <p className="mt-1.5 mb-0 font-mono text-[11px] leading-[1.5] opacity-55">
          {mode === "sign-in"
            ? "Sign in to access your notes and connections."
            : "Create an account and start linking ideas."}
        </p>

        {/* Tabs */}
        <div
          className="mt-5 mb-5 flex gap-5 border-b border-[color-mix(in_srgb,var(--color-foreground)_12%,transparent)]"
          role="tablist"
          aria-label="Authentication mode"
        >
          <button
            type="button"
            className={tabClassName(mode === "sign-in")}
            onClick={() => setMode("sign-in")}
            role="tab"
            aria-selected={mode === "sign-in"}
          >
            Sign in
          </button>
          <button
            type="button"
            className={tabClassName(mode === "sign-up")}
            onClick={() => setMode("sign-up")}
            role="tab"
            aria-selected={mode === "sign-up"}
          >
            Sign up
          </button>
        </div>

        {/* CTA */}
        {mode === "sign-in" ? (
          <SignInButton mode="modal">
            <button type="button" className={ctaClassName}>
              Continue with Sign In&ensp;&rarr;
            </button>
          </SignInButton>
        ) : (
          <SignUpButton mode="modal">
            <button type="button" className={ctaClassName}>
              Create Account&ensp;&rarr;
            </button>
          </SignUpButton>
        )}

        {/* Footer toggle */}
        <p className="mt-4 mb-0 text-center font-mono text-[10px] opacity-45">
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] text-[var(--color-foreground)] underline underline-offset-2 opacity-70 transition-opacity duration-150 hover:opacity-100"
                onClick={() => setMode("sign-up")}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] text-[var(--color-foreground)] underline underline-offset-2 opacity-70 transition-opacity duration-150 hover:opacity-100"
                onClick={() => setMode("sign-in")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
};
