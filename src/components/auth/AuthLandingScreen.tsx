import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { InkNotePreviewGraph } from "./InkNotePreviewGraph";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/button";

export const AuthLandingScreen = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!h1Ref.current) return;
      gsap.fromTo(
        h1Ref.current,
        { x: "-100%" },
        { x: 0, duration: 0.8, ease: "power3.out" },
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      className="flex h-full w-full items-center lg:w-[800px] mx-auto"
      aria-label="Ink Note authentication landing"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] items-center gap-[clamp(1.2rem,4vw,4rem)] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(0,1fr)_auto] max-[980px]:items-start max-[980px]:gap-[1.4rem]">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div ref={containerRef}>
            <div className="overflow-hidden">
              <h1
                ref={h1Ref}
                className="text-[4rem] tracking-[-0.04em] geist-pixel-line text-box-trim select-none"
              >
                ink-note
              </h1>
            </div>
          </div>

          {/* Description */}
          <p className="text-[.9rem] leading-[1.45] opacity-80 font-mono text-xs font-extralight text-box-trim select-none">
            EXPLORE IDEAS BY CONNECTING DOTS.
          </p>

          {/* Sign In Button */}
          <SignInButton mode="modal">
            <Button className="max-w-[345px] text-sm shadow-[2px_2px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] transition-[transform,box-shadow] duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_color-mix(in_srgb,var(--color-foreground)_40%,transparent)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              Continue&ensp;&rarr;
            </Button>
          </SignInButton>
        </div>

        <div className="flex min-h-0 items-center justify-center max-[980px]:justify-start">
          <InkNotePreviewGraph />
        </div>
      </div>
    </section>
  );
};
