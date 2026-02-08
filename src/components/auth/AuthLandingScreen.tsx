import { AuthCard } from "./AuthCard";
import { InkNotePreviewGraph } from "./InkNotePreviewGraph";

export const AuthLandingScreen = () => {
  return (
    <section
      className="box-border flex h-full w-full items-center p-[clamp(1rem,3vw,2.5rem)] max-[980px]:p-4"
      aria-label="Ink Note authentication landing"
    >
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] items-center gap-[clamp(1.2rem,4vw,4rem)] max-[980px]:grid-cols-1 max-[980px]:grid-rows-[minmax(0,1fr)_auto] max-[980px]:items-start max-[980px]:gap-[1.4rem]">
        <div className="flex min-h-0 flex-col gap-4">
          <div>
            <h1
              className={`m-0 text-[clamp(1.6rem,2.5vw,2.2rem)] tracking-[-0.04em]`}
            >
              ink-note
            </h1>
            <p className="mt-[0.35rem] max-w-[60ch] text-[0.9rem] leading-[1.45] opacity-80">
              Explore how notes connect before signing in. Drag and click the
              graph to preview how Ink Note links ideas together.
            </p>
          </div>

          <InkNotePreviewGraph />
        </div>

        <div className="flex min-h-0 items-center justify-center max-[980px]:justify-start">
          <AuthCard />
        </div>
      </div>
    </section>
  );
};
