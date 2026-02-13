// Icons are removed since they were unused

const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPad|iPhone/.test(navigator.platform);

const shortcut = (mac: string, win: string) => (isMac ? mac : win);

export const Toolbar = () => {
    return (
        <div className="fixed top-4 left-4 z-50 pointer-events-none select-none text-[var(--color-foreground)]">
            <h1 className="text-2xl font-semibold mb-2 italic tracking-tighter">ink-note</h1>

            <div className="text-sm space-y-1 opacity-60">
                <div className="flex items-center gap-2">
                    <span className="rounded bg-foreground/10 px-1">{shortcut("⌘N", "Ctrl+N")}</span>
                    <span className="">New Note</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded bg-foreground/10 px-1">{shortcut("⌘P", "Ctrl+P")}</span>
                    <span>Search</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded bg-foreground/10 px-1">{shortcut("⌘W", "Ctrl+W")}</span>
                    <span>Close Note</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded bg-foreground/10 px-1">{shortcut("⌘⇧L", "Ctrl+Shift+L")}</span>
                    <span>Toggle Theme</span>
                </div>
            </div>
        </div>
    );
};
