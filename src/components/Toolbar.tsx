// Icons are removed since they were unused


export const Toolbar = () => {
    return (
        <div className="fixed top-4 left-4 z-50 pointer-events-none select-none text-[var(--color-fg)]">
            <h1 className="text-2xl font-bold mb-2 tracking-tighter">ink-note</h1>

            <div className="text-xs space-y-1 opacity-60 font-mono">
                <div className="flex items-center gap-2">
                    <span className="bg-[var(--color-fg)] text-[var(--color-bg)] px-1 rounded text-xs px-1">⌘N</span>
                    <span>New Note</span>
                </div>
                {/* Placeholder for search */}
                {/*
        <div className="flex items-center gap-2">
            <span className="bg-[var(--color-fg)] text-[var(--color-bg)] px-1 rounded text-xs px-1">⌘K</span>
            <span>Search</span>
        </div>
        */}
            </div>
        </div>
    );
};
