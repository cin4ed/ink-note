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

  return (
    <section className="auth-card-shell" aria-label="Authentication form">
      <div className="auth-card-tabs" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={`auth-card-tab${mode === "sign-in" ? " is-active" : ""}`}
          onClick={() => setMode("sign-in")}
          role="tab"
          aria-selected={mode === "sign-in"}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`auth-card-tab${mode === "sign-up" ? " is-active" : ""}`}
          onClick={() => setMode("sign-up")}
          role="tab"
          aria-selected={mode === "sign-up"}
        >
          Sign up
        </button>
      </div>

      <div className="auth-card-content auth-clerk-shell">
        {mode === "sign-in" ? (
          <SignIn routing="virtual" appearance={clerkAppearance} />
        ) : (
          <SignUp routing="virtual" appearance={clerkAppearance} />
        )}
      </div>
    </section>
  );
};
