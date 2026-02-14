const keymap = {
  macos: {
    newNote: "Ctrl + N",
    sarch: "Ctrl + P",
    closeNote: "Ctrl + W",
    toggleTheme: "Ctrl + Shift + L",
  },
  windows: {
    newNote: "Ctrl + Alt + N",
    sarch: "Ctrl + Alt + P",
    closeNote: "Ctrl + Alt + W",
    toggleTheme: "Ctrl + Shift + L",
  },
};

const isMacos = navigator.userAgent.includes("Mac");
const currentKeymap = isMacos ? keymap.macos : keymap.windows;

export const Toolbar = () => {
  return (
    <div className="fixed top-4 left-4 pointer-events-none select-none text-[var(--color-foreground)]">
      <h1 className="text-2xl font-semibold mb-2 italic tracking-tighter">
        ink-note
      </h1>

      <div className="text-sm space-y-1 opacity-60">
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground/10 px-1">
            {currentKeymap.newNote}
          </span>
          <span className="">New Note</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground/10 px-1">
            {currentKeymap.sarch}
          </span>
          <span>Search</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground/10 px-1">
            {currentKeymap.closeNote}
          </span>
          <span>Close Note</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-foreground/10 px-1">
            {currentKeymap.toggleTheme}
          </span>
          <span>Toggle Theme</span>
        </div>
      </div>
    </div>
  );
};
