import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Note } from '../types';

const INITIAL_NOTE_WIDTH = 300;
const INITIAL_NOTE_HEIGHT = 200;

export const useStore = create<AppState>((set) => ({
    notes: [
        {
            id: 'welcome-note',
            title: 'Welcome to ink-note',
            content: 'This is a minimalistic, node-based note taking app.\n\nDrag this window around!',
            position: { x: 100, y: 100 },
            size: { width: INITIAL_NOTE_WIDTH, height: INITIAL_NOTE_HEIGHT },
            connections: [],
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
            };
            return { notes: [...state.notes, newNote] };
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

                    // Update Mention HTML in content (for ALL notes, including the one being renamed if it refers to itself somehow, though unlikely)
                    // We need to replace data-id="oldId" with data-id="newId"
                    // AND update the label if we want to keep it in sync with the new title (which we do, derived from the newId potentially, but we should probably look up the note's new title)
                    // Wait, changeNoteId is called when the *title* changes (and thus ID).
                    // So we know the new ID. We can infer the new label from the ID or just use the ID as the label for now?
                    // Actually, the previous step in NoteWindow calculates newId from title.
                    // But here we only have newId.
                    // Ideally `changeNoteId` should also take `newTitle` or we find the note and get its title?
                    // But the note with `oldId` isn't updated in the array yet.
                    // Let's assume the label should match the newId formatted or we just update the ID link?
                    // The user said: "update the reference labels when a note's title (and consequently its ID) changes"
                    // So we should try to update the label too.
                    // Let's just use the newId as the label for now (maybe prettified) or just the newId string.
                    // Actually, looking at NoteWindow, we only pass newId.
                    // Better approach: just use newId for the label for now since it's a slug.
                    // Or, simpler: Just update data-id so the link works. The label might become stale?
                    // The user said: "After the user selects a note... a badge... denotating this is a link"
                    // "what will happen if the user changes the title... note already has referenced"
                    // Updating the text content of the span is hard without a full DOM parser or strict regex.
                    // Let's try a regex for the standard Tiptap mention markup.

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
}));
