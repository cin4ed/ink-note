import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Note } from '../types';

const INITIAL_NOTE_WIDTH = 300;
const INITIAL_NOTE_HEIGHT = 200;

export const useStore = create<AppState>()(persist((set) => ({
    notes: [
        {
            id: 'welcome-note',
            title: 'Welcome to ink-note',
            content: 'This is a minimalistic, node-based note taking app.\n\nDrag this window around!',
            position: { x: 100, y: 100 },
            size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
            connections: [],
            isOpen: true,
        },
    ],

    addNote: (position) =>
        set((state) => {
            const id = uuidv4();
            const newNote: Note = {
                id,
                title: 'New Note',
                content: '',
                position: position || {
                    x: window.innerWidth / 2 - INITIAL_NOTE_WIDTH / 2 + (Math.random() * 50 - 25),
                    y: window.innerHeight / 2 - INITIAL_NOTE_HEIGHT / 2 + (Math.random() * 50 - 25)
                },
                size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
                connections: [],
                isOpen: true,
            };
            return {
                notes: [...state.notes, newNote],
                focusTargetId: id,
                focusedNoteId: id
            };
        }),

    updateNote: (id, updates) =>
        set((state) => ({
            notes: state.notes.map((note) => {
                if (note.id !== id) return note;

                const updatedNote = { ...note, ...updates };

                // Parse content for connections if content was updated
                if (updates.content !== undefined) {
                    const matches = updates.content.matchAll(/data-id="([^"]+)"/g);
                    const newConnections = new Set<string>();
                    for (const match of matches) {
                        const targetId = match[1];
                        if (targetId && targetId !== id) {
                            newConnections.add(targetId);
                        }
                    }
                    updatedNote.connections = Array.from(newConnections);
                }

                return updatedNote;
            }),
        })),

    deleteNote: (id) =>
        set((state) => ({
            notes: state.notes
                .filter((note) => note.id !== id)
                .map((note) => ({
                    ...note,
                    connections: note.connections.filter((connId) => connId !== id),
                })),
        })),

    connectNotes: (sourceId, targetId) =>
        set((state) => {
            // Prevent self-connection and duplicates
            if (sourceId === targetId) return state;

            const sourceNote = state.notes.find(n => n.id === sourceId);
            if (!sourceNote || sourceNote.connections.includes(targetId)) return state;

            return {
                notes: state.notes.map((note) => {
                    if (note.id === sourceId) {
                        return { ...note, connections: [...note.connections, targetId] };
                    }
                    if (note.id === targetId) {
                        // Bidirectional connection ? Or directional?
                        // Usually graphs are easier if bidirectional for visual connections,
                        // but logically simplified to "references".
                        // Let's make it bidirectional for the visual graph for now, or just handle one way.
                        // The requirement says "connected through references". 
                        // For simplicity, let's just update the source for now.
                        // But if we want a "graph", usually links are edges.
                        return note;
                    }
                    return note;
                })
            };
        }),

    disconnectNotes: (sourceId, targetId) =>
        set((state) => ({
            notes: state.notes.map((note) =>
                note.id === sourceId
                    ? { ...note, connections: note.connections.filter((id) => id !== targetId) }
                    : note
            ),
        })),

    focusTargetId: null,
    setFocusTarget: (id) => set({ focusTargetId: id }),
    focusedNoteId: null,
    setFocusedNote: (id) => set({ focusedNoteId: id }),

    changeNoteId: (oldId, newId) =>
        set((state) => {
            if (state.notes.some((n) => n.id === newId)) {
                console.warn(`Note ID collision: ${newId} already exists.`);
                return state;
            }

            return {
                focusTargetId: newId, // Trigger focus on the new ID
                notes: state.notes.map((note) => {
                    let updatedNote = note;

                    // Update ID of the target note
                    if (note.id === oldId) {
                        updatedNote = { ...note, id: newId };
                    }

                    // Update references in connections for other notes
                    if (note.connections.includes(oldId)) {
                        updatedNote = {
                            ...updatedNote,
                            connections: updatedNote.connections.map((connId) =>
                                connId === oldId ? newId : connId
                            ),
                        };
                    }

                    if (updatedNote.content.includes(`data-id="${oldId}"`)) {
                        // Find the source note to get the new label (title)
                        const sourceNote = state.notes.find(n => n.id === oldId);
                        const newLabel = sourceNote ? sourceNote.title : newId;

                        const regex = new RegExp(`(<span[^>]*data-id="${oldId}"[^>]*>)([^<]*)</span>`, 'g');

                        const newContentWithLabel = updatedNote.content.replace(regex, (_match, openTag, _textContent) => {
                            const newOpenTag = openTag.replace(`data-id="${oldId}"`, `data-id="${newId}"`);
                            return `${newOpenTag}@${newLabel}</span>`;
                        });

                        updatedNote = { ...updatedNote, content: newContentWithLabel };
                    }

                    return updatedNote;
                }),
            };
        }),

    closeNote: (id) =>
        set((state) => {
            const note = state.notes.find((n) => n.id === id);
            if (!note) return state;

            // If the note has the default title, delete it permanently
            if (note.title === 'New Note') {
                const remainingNotes = state.notes
                        .filter((n) => n.id !== id)
                        .map((n) => ({
                            ...n,
                            connections: n.connections.filter((connId) => connId !== id),
                        }));
                const openNotes = remainingNotes.filter((n) => n.isOpen !== false);
                const nextFocusedNoteId = openNotes.length > 0 ? openNotes[openNotes.length - 1].id : null;
                return {
                    notes: remainingNotes,
                    focusedNoteId: state.focusedNoteId === id ? nextFocusedNoteId : state.focusedNoteId,
                };
            }

            // Otherwise, just hide it (soft delete / close)
            const updatedNotes = state.notes.map((n) =>
                n.id === id ? { ...n, isOpen: false } : n
            );
            const openNotes = updatedNotes.filter((n) => n.isOpen !== false);
            const nextFocusedNoteId = openNotes.length > 0 ? openNotes[openNotes.length - 1].id : null;
            return {
                notes: updatedNotes,
                focusedNoteId: state.focusedNoteId === id ? nextFocusedNoteId : state.focusedNoteId,
            };
        }),

    openNote: (id) =>
        set((state) => {
            const targetNote = state.notes.find((n) => n.id === id);
            if (!targetNote) return state;

            const shouldCenter = targetNote.isOpen === false;
            const width = targetNote.size?.width ?? INITIAL_NOTE_WIDTH;
            const height = targetNote.size?.height ?? INITIAL_NOTE_HEIGHT;
            const centeredPosition = {
                x: window.innerWidth / 2 - width / 2,
                y: window.innerHeight / 2 - height / 2,
            };

            return {
                notes: state.notes.map((n) =>
                    n.id === id
                        ? { ...n, isOpen: true, position: shouldCenter ? centeredPosition : n.position }
                        : n
                ),
                focusTargetId: id,
                focusedNoteId: id,
            };
        }),
}), {
    name: 'ink-note-storage',
}));
