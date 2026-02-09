import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { X, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import { NoteEditor } from './NoteEditor';
import type { NoteEditorHandle } from './NoteEditor';
import type { Note } from '../types';

interface NoteWindowProps {
    note: Note;
}

export const NoteWindow: React.FC<NoteWindowProps> = ({ note }) => {
    const updateNote = useStore((state) => state.updateNote);
    const closeNote = useStore((state) => state.closeNote);
    const changeNoteId = useStore((state) => state.changeNoteId);
    const focusTargetId = useStore((state) => state.focusTargetId);
    const setFocusTarget = useStore((state) => state.setFocusTarget);
    const setFocusedNote = useStore((state) => state.setFocusedNote);

    const nodeRef = useRef(null);
    const contentRef = useRef<NoteEditorHandle>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    // Auto-focus title if this note is the focus target (e.g. just created)
    // Auto-focus title if this note is the focus target (e.g. just created)
    React.useEffect(() => {
        if (focusTargetId === note.id && titleRef.current) {
            const timer = setTimeout(() => {
                titleRef.current?.focus();
                titleRef.current?.select();
                setFocusTarget(null); // Clear target after focus is achieved
            }, 100); // 100ms delay to be safe
            return () => clearTimeout(timer);
        }
    }, [focusTargetId, note.id, setFocusTarget]);

    const handleStop = (_e: any, data: { x: number; y: number }) => {
        updateNote(note.id, { position: { x: data.x, y: data.y } });
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = note.size?.width || 300;
        const startHeight = note.size?.height || 200;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(150, startHeight + (moveEvent.clientY - startY));
            updateNote(note.id, { size: { width: newWidth, height: newHeight } });
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
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
                onMouseDown={() => setFocusedNote(note.id)}
                onFocusCapture={() => setFocusedNote(note.id)}
                className="pointer-events-auto absolute bg-[var(--color-background)] border border-[var(--color-foreground)] shadow-[4px_4px_0px_var(--color-foreground)] flex flex-col overflow-hidden"
                style={{
                    width: note.size?.width ?? 300,
                    height: note.size?.height ?? 200
                }}
            >
                {/* Header / Drag Handle */}
                <div className="flex items-center justify-between p-2 border-b border-[var(--color-foreground)] cursor-move drag-handle group">
                    <div className="flex flex-col flex-grow min-w-0 mr-2">
                        <input
                            ref={titleRef}
                            type="text"
                            value={note.title}
                            onChange={(e) => updateNote(note.id, { title: e.target.value })}
                            onKeyDown={handleTitleKeyDown}
                            onDoubleClick={handleTitleDoubleClick}
                            className="nodrag bg-transparent font-bold outline-none w-full text-[var(--color-foreground)] placeholder-[var(--color-foreground)]/50"
                            placeholder="Title..."
                        />
                        <span className="text-[10px] opacity-40 font-mono select-none truncate">{note.id}</span>
                    </div>
                    <button
                        onClick={() => closeNote(note.id)}
                        className="text-[var(--color-foreground)] hover:opacity-50 transition-opacity shrink-0"
                        aria-label="Close note"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow w-full overflow-hidden flex flex-col nodrag">
                    <NoteEditor
                        ref={contentRef}
                        initialContent={note.content}
                        noteId={note.id}
                        onUpdate={(content) => updateNote(note.id, { content })}
                    />
                </div>

                {/* Resize Handle */}
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize nodrag flex items-end justify-end p-1 group z-10"
                    onMouseDown={handleResizeMouseDown}
                >
                    <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} className="rotate-90 scale-x-[-1]" />
                    </div>
                </div>
            </div>
        </Draggable>
    );
};
