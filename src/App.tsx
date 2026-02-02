import { useEffect, useState } from 'react';
import { WindowManager } from './components/WindowManager';
import { Toolbar } from './components/Toolbar';
import { SearchPanel } from './components/SearchPanel';
import { useStore } from './store/useStore';

function App() {
  const addNote = useStore((state) => state.addNote);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + N: New Note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addNote();
      }
      // CMD/CTRL + P: Search Notes
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNote]);

  return (
    <main className="w-screen h-screen bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300">
      <Toolbar />
      <WindowManager />
      <SearchPanel isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}

export default App;
