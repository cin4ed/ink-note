import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

interface SearchPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
    const notes = useStore((state) => state.notes);
    const openNote = useStore((state) => state.openNote);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter notes based on query
    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(query.toLowerCase())
    );

    // Reset state when panel opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            // Focus input after a short delay to ensure the panel is rendered
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Reset selected index when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredNotes.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredNotes.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredNotes.length) % filteredNotes.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredNotes[selectedIndex]) {
                openNote(filteredNotes[selectedIndex].id);
                onClose();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    const handleSelectNote = (id: string) => {
        openNote(id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Panel */}
            <div
                className="relative bg-[var(--color-bg)] border border-[var(--color-fg)] shadow-[4px_4px_0px_var(--color-fg)] w-[400px] max-w-[90vw] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-3 border-b border-[var(--color-fg)]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search notes..."
                        className="w-full bg-transparent outline-none text-[var(--color-fg)] placeholder-[var(--color-fg)]/50 font-mono"
                    />
                </div>

                {/* Results List */}
                <div className="max-h-[300px] overflow-y-auto">
                    {filteredNotes.length === 0 ? (
                        <div className="p-3 text-[var(--color-fg)]/50 text-sm font-mono">
                            No notes found
                        </div>
                    ) : (
                        filteredNotes.map((note, index) => (
                            <button
                                key={note.id}
                                onClick={() => handleSelectNote(note.id)}
                                className={`w-full text-left px-3 py-2 font-mono text-sm transition-colors truncate flex items-center gap-2
                                    ${index === selectedIndex
                                        ? 'bg-[var(--color-fg)] text-[var(--color-bg)]'
                                        : 'text-[var(--color-fg)] hover:bg-[var(--color-fg)]/10'
                                    }`}
                            >
                                <span className="truncate">{note.title}</span>
                                {!note.isOpen && (
                                    <span className="text-xs opacity-50">(closed)</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
