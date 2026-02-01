import { useEffect } from 'react';
import { WindowManager } from './components/WindowManager';
import { Toolbar } from './components/Toolbar';
import { useStore } from './store/useStore';

function App() {
  const addNote = useStore((state) => state.addNote);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + N: New Note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        addNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNote]);

  return (
    <main className="w-screen h-screen bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300">
      <Toolbar />
      <WindowManager />
    </main>
  );
}

export default App;
