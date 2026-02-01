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
    const nodeRef = useRef(null);

    const handleStop = (_e: any, data: { x: number; y: number }) => {
        updateNote(note.id, { position: { x: data.x, y: data.y } });
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            defaultPosition={note.position}
            onStop={handleStop}
            handle=".drag-handle"
        >
            <div
                ref={nodeRef}
                className="pointer-events-auto absolute w-[300px] h-[200px] bg-[var(--color-bg)] border border-[var(--color-fg)] shadow-[4px_4px_0px_var(--color-fg)] flex flex-col overflow-hidden"
            >
                {/* Header / Drag Handle */}
                <div className="flex items-center justify-between p-2 border-b border-[var(--color-fg)] cursor-move drag-handle group">
                    <input
                        type="text"
                        value={note.title}
                        onChange={(e) => updateNote(note.id, { title: e.target.value })}
                        className="bg-transparent font-bold outline-none flex-grow text-[var(--color-fg)] placeholder-[var(--color-fg)]/50"
                        placeholder="Title..."
                    />
                    <button
                        onClick={() => deleteNote(note.id)}
                        className="text-[var(--color-fg)] hover:opacity-50 transition-opacity"
                        aria-label="Close note"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content Area */}
                <textarea
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
