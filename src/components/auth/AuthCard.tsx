import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";

type AuthMode = "sign-in" | "sign-up";

const clerkAppearance = {
  elements: {
    rootBox: "ink-clerk-root",
    cardBox: "ink-clerk-card-box",
    card: "ink-clerk-card",
    main: "ink-clerk-main",
    footer: "ink-clerk-footer",
    page: "ink-clerk-page",
    pageScrollBox: "ink-clerk-page-scroll-box",
    headerTitle: "ink-clerk-header-title",
    headerSubtitle: "ink-clerk-header-subtitle",
    formFieldInput: "ink-clerk-input",
    formButtonPrimary: "ink-clerk-primary-btn",
    socialButtonsBlockButton: "ink-clerk-social-btn",
    footerActionLink: "ink-clerk-link",
  },
};

export const AuthCard = () => {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const tabClassName = (isActive: boolean) =>
    `cursor-pointer border-0 border-b bg-transparent px-0 py-1 font-mono text-xs text-[var(--color-fg)] transition-[opacity,border-color] duration-[120ms] hover:opacity-[0.85] ${isActive ? "border-[var(--color-fg)]" : "border-transparent"}`;

  return (
    <section
      className="box-border w-full max-w-[420px] max-[980px]:max-w-none"
      aria-label="Authentication form"
    >
      <div className="mb-[1.1rem] flex gap-[1.1rem]" role="tablist" aria-label="Authentication mode">
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

      <div className="auth-clerk-shell min-h-0 max-[640px]:min-h-[370px]">
        {mode === "sign-in" ? (
          <SignIn routing="virtual" appearance={clerkAppearance} />
        ) : (
          <SignUp routing="virtual" appearance={clerkAppearance} />
        )}
      </div>
    </section>
  );
};
