import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { X, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Note } from '../types';

interface NoteWindowProps {
    note: Note;
}

export const NoteWindow: React.FC<NoteWindowProps> = ({ note }) => {
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    const changeNoteId = useStore((state) => state.changeNoteId);
    const focusTargetId = useStore((state) => state.focusTargetId);
    const setFocusTarget = useStore((state) => state.setFocusTarget);

    const nodeRef = useRef(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus content if this note is the focus target
    React.useEffect(() => {
        if (focusTargetId === note.id && contentRef.current) {
            contentRef.current.focus();
            // Optional: place cursor at end? contentRef.current.setSelectionRange(length, length);
            setFocusTarget(null); // Clear target so it doesn't keep stealing focus
        }
    }, [focusTargetId, note.id, setFocusTarget]);

    const handleStop = (_e: any, data: { x: number; y: number }) => {
        updateNote(note.id, { position: { x: data.x, y: data.y } });
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newId = note.title
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')     // Spaces to dashes
                .replace(/[^a-z0-9-]/g, ''); // Remove special chars

            if (newId && newId !== note.id) {
                changeNoteId(note.id, newId);
            } else {
                // If ID didn't change (or invalid), just move focus to content
                contentRef.current?.focus();
            }
        }
    };

    const handleTitleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.currentTarget.select();
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={note.position}
            onStop={handleStop}
            handle=".drag-handle"
            cancel=".nodrag"
        >
            <div
                ref={nodeRef}
                className="pointer-events-auto absolute w-[300px] h-[200px] bg-[var(--color-bg)] border border-[var(--color-fg)] shadow-[4px_4px_0px_var(--color-fg)] flex flex-col overflow-hidden"
            >
                {/* Header / Drag Handle */}
                <div className="flex items-center justify-between p-2 border-b border-[var(--color-fg)] cursor-move drag-handle group">
                    <div className="flex flex-col flex-grow min-w-0 mr-2">
                        <input
                            type="text"
                            value={note.title}
                            onChange={(e) => updateNote(note.id, { title: e.target.value })}
                            onKeyDown={handleTitleKeyDown}
                            onDoubleClick={handleTitleDoubleClick}
                            className="nodrag bg-transparent font-bold outline-none w-full text-[var(--color-fg)] placeholder-[var(--color-fg)]/50"
                            placeholder="Title..."
                        />
                        <span className="text-[10px] opacity-40 font-mono select-none truncate">{note.id}</span>
                    </div>
                    <button
                        onClick={() => deleteNote(note.id)}
                        className="text-[var(--color-fg)] hover:opacity-50 transition-opacity shrink-0"
                        aria-label="Close note"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content Area */}
                <textarea
                    ref={contentRef}
                    value={note.content}
                    onChange={(e) => updateNote(note.id, { content: e.target.value })}
                    className="flex-grow w-full p-2 bg-transparent outline-none resize-none font-mono text-sm text-[var(--color-fg)] placeholder-[var(--color-fg)]/30"
                    placeholder="Write something..."
                />

                {/* Connection Handle (visual cue) */}
                <div className="absolute bottom-1 right-1 opacity-20 pointer-events-none">
                    <ExternalLink size={12} />
                </div>
            </div>
        </Draggable>
    );
};
