export interface Position {
    x: number;
    y: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    position: Position;
    connections: string[]; // IDs of connected notes
}

export interface AppState {
    notes: Note[];

    addNote: (position?: Position) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    connectNotes: (sourceId: string, targetId: string) => void;
    disconnectNotes: (sourceId: string, targetId: string) => void;

    // ID update & Focus management
    focusTargetId: string | null;
    setFocusTarget: (id: string | null) => void;
    changeNoteId: (oldId: string, newId: string) => void;
}
