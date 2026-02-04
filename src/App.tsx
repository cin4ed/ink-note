import { useEffect, useState } from 'react';
import { WindowManager } from './components/WindowManager';
import { Toolbar } from './components/Toolbar';
import { SearchPanel } from './components/SearchPanel';
import { RecentNotes } from './components/RecentNotes';
import { useStore } from './store/useStore';

function App() {
  const addNote = useStore((state) => state.addNote);
  const closeNote = useStore((state) => state.closeNote);
  const focusedNoteId = useStore((state) => state.focusedNoteId);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('ink-note-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ink-note-theme', theme);
    window.dispatchEvent(new Event('ink-theme-change'));
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // CMD/CTRL + N: New Note
      if ((e.metaKey || e.ctrlKey) && key === 'n') {
        e.preventDefault();
        addNote();
      }
      // CMD/CTRL + P: Search Notes
      if ((e.metaKey || e.ctrlKey) && key === 'p') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // CMD/CTRL + W: Close Focused Note
      if ((e.metaKey || e.ctrlKey) && key === 'w') {
        if (!focusedNoteId) return;
        e.preventDefault();
        closeNote(focusedNoteId);
      }
      // CMD/CTRL + SHIFT + L: Toggle Theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === 'l') {
        e.preventDefault();
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNote, closeNote, focusedNoteId]);

  return (
    <main className="w-screen h-screen bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300">
      <Toolbar />
      <RecentNotes />
      <WindowManager />
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}

export default App;
