import { lazy, Suspense, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/button";

const InkNotePreviewGraph = lazy(() =>
  import("./InkNotePreviewGraph").then((m) => ({
    default: m.InkNotePreviewGraph,
  })),
);

const featureHints = [
  "Spatial canvas",
  "Linked mentions",
  "Rich text editor",
] as const;

export const AuthLandingScreen = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from("[data-landing='title']", {
        y: 32,
        opacity: 0,
        duration: 0.9,
      })
        .from(
          "[data-landing='tagline']",
          { y: 22, opacity: 0, duration: 0.7 },
          "-=0.5",
        )
        .from(
          "[data-landing='desc']",
          { y: 16, opacity: 0, duration: 0.6 },
          "-=0.4",
        )
        .from(
          "[data-landing='cta']",
          { y: 14, opacity: 0, duration: 0.6 },
          "-=0.3",
        )
        .from(
          "[data-landing='features']",
          { y: 10, opacity: 0, duration: 0.5 },
          "-=0.2",
        )
        .from(
          "[data-landing='graph']",
          { opacity: 0, duration: 1.8, ease: "power2.inOut" },
          0.2,
        );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      aria-label="Ink Note — think in connections"
    >
      {/* Ambient 3D graph — auto-rotates behind everything */}
      <div
        data-landing="graph"
        className="landing-graph-bg pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      >
        <Suspense fallback={null}>
          <InkNotePreviewGraph />
        </Suspense>
      </div>

      {/* Soft radial vignette so text stays readable over the graph */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 58% 52% at 50% 48%, var(--color-background) 0%, transparent 100%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
        {/* Title */}
        <h1
          data-landing="title"
          className="geist-pixel-line text-box-trim select-none text-[clamp(3rem,8vw,5.5rem)] leading-[0.95] tracking-[-0.04em]"
        >
          ink-note
        </h1>

        {/* Tagline */}
        <p
          data-landing="tagline"
          className="mt-5 select-none text-[clamp(1.05rem,2.4vw,1.35rem)] leading-snug tracking-[-0.015em]"
        >
          Think in connections, not pages.
        </p>

        {/* Description */}
        <p
          data-landing="desc"
          className="mt-4 max-w-[22rem] select-none font-mono text-[0.78rem] leading-[1.65] opacity-50"
        >
          A free, spatial canvas for your notes&mdash;where ideas link to ideas
          and form a living web of thought.
        </p>

        {/* CTA */}
        <div
          data-landing="cta"
          className="mt-7 flex flex-col items-center gap-2.5"
        >
          <SignInButton mode="modal">
            <Button className="px-7 py-2.5 text-sm shadow-[2px_2px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Start writing&ensp;&rarr;
            </Button>
          </SignInButton>
        </div>

        {/* Feature hints */}
        <div
          data-landing="features"
          className="mt-9 flex flex-wrap justify-center gap-x-5 gap-y-2 select-none font-mono text-[0.68rem] uppercase tracking-[0.06em] opacity-40"
        >
          {featureHints.map((label) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-[3px] w-[3px] rounded-full bg-foreground opacity-60" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
