import { AuthCard } from "./AuthCard";
import { InkNotePreviewGraph } from "./InkNotePreviewGraph";

export const AuthLandingScreen = () => {
  return (
    <section
      className="auth-landing-root"
      aria-label="Ink Note authentication landing"
    >
      <div className="auth-landing-panel">
        <div className="auth-landing-graph-column">
          <div className="auth-landing-copy">
            <h1>ink-note</h1>
            <p>
              Explore how notes connect before signing in. Drag and click the
              graph to preview how Ink Note links ideas together.
            </p>
          </div>

          <InkNotePreviewGraph />
        </div>

        <div className="auth-landing-auth-column">
          <AuthCard />
        </div>
      </div>
    </section>
  );
};
