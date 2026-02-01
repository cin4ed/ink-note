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
                connections: [],
            };
            return { notes: [...state.notes, newNote] };
        }),

    updateNote: (id, updates) =>
        set((state) => ({
            notes: state.notes.map((note) =>
                note.id === id ? { ...note, ...updates } : note
            ),
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
}));
