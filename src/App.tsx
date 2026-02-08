import { useCallback, useEffect, useState } from "react";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { WindowManager } from "./components/WindowManager";
import { Toolbar } from "./components/Toolbar";
import { SearchPanel } from "./components/SearchPanel";
import { RecentNotes } from "./components/RecentNotes";
import { AuthLandingScreen } from "./components/auth/AuthLandingScreen";
import { AccountControl } from "./components/AccountControl";
import { useStore } from "./store/useStore";

const WorkspaceShell = ({ onToggleTheme }: { onToggleTheme: () => void }) => {
  const addNote = useStore((state) => state.addNote);
  const closeNote = useStore((state) => state.closeNote);
  const focusedNoteId = useStore((state) => state.focusedNoteId);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // CMD/CTRL + N: New Note
      if ((event.metaKey || event.ctrlKey) && key === "n") {
        event.preventDefault();
        addNote();
      }

      // CMD/CTRL + P: Search Notes
      if ((event.metaKey || event.ctrlKey) && key === "p") {
        event.preventDefault();
        setIsSearchOpen(true);
      }

      // CMD/CTRL + W: Close Focused Note
      if ((event.metaKey || event.ctrlKey) && key === "w") {
        if (!focusedNoteId) return;
        event.preventDefault();
        closeNote(focusedNoteId);
      }

      // CMD/CTRL + SHIFT + L: Toggle Theme
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === "l") {
        event.preventDefault();
        onToggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addNote, closeNote, focusedNoteId, onToggleTheme]);

  return (
    <>
      <Toolbar />
      <AccountControl />
      <RecentNotes />
      <WindowManager />
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("ink-note-theme");
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ink-note-theme", theme);
    window.dispatchEvent(new Event("ink-theme-change"));
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => (previous === "light" ? "dark" : "light"));
  }, []);

  return (
    <main className="w-screen h-screen bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300">
      <AuthLoading>
        <section className="auth-loading-state">
          Loading authentication...
        </section>
      </AuthLoading>

      <Unauthenticated>
        <AuthLandingScreen />
      </Unauthenticated>

      <Authenticated>
        <WorkspaceShell onToggleTheme={toggleTheme} />
      </Authenticated>
    </main>
  );
}

export default App;
