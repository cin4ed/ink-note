import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { WindowManager } from "./components/WindowManager";
import { Toolbar } from "./components/Toolbar";
import { SearchPanel } from "./components/SearchPanel";
import { RecentNotes } from "./components/RecentNotes";
import {
  NotesModelProvider,
  useNotesModel,
  useWorkspaceFocus,
} from "./features/notes/useNotesModel";

const AuthLandingScreen = lazy(() =>
  import("./components/auth/AuthLandingScreen").then((m) => ({
    default: m.AuthLandingScreen,
  })),
);

const WorkspaceShell = ({ onToggleTheme }: { onToggleTheme: () => void }) => {
  const { addNote, closeNote } = useNotesModel();
  const { focusedNoteId } = useWorkspaceFocus();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // CTRL + N: New Note
      if (event.ctrlKey && key === "n") {
        event.preventDefault();
        void addNote();
      }

      // CTRL + P: Search Notes
      if (event.ctrlKey && key === "p") {
        event.preventDefault();
        setIsSearchOpen(true);
      }

      // CTRL + W: Close Focused Note
      if (event.ctrlKey && key === "w") {
        if (!focusedNoteId) return;
        event.preventDefault();
        void closeNote(focusedNoteId);
      }

      // CTRL + SHIFT + L: Toggle Theme
      if (event.ctrlKey && event.shiftKey && key === "l") {
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
      {/* <AccountControl /> */}
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
    <main className="w-screen h-screen bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors duration-300 antialiased">
      <AuthLoading>
        <section className="grid h-full w-full place-items-center font-mono text-xs uppercase tracking-[0.03em] opacity-70">
          Loading authentication...
        </section>
      </AuthLoading>

      <Unauthenticated>
        <Suspense fallback={null}>
          <AuthLandingScreen />
        </Suspense>
      </Unauthenticated>

      <Authenticated>
        <NotesModelProvider>
          <WorkspaceShell onToggleTheme={toggleTheme} />
        </NotesModelProvider>
      </Authenticated>
    </main>
  );
}

export default App;
