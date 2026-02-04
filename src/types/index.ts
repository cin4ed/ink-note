export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number; // epoch ms
    updatedAt: number; // epoch ms
    position: Position;
    size?: Size;
    connections: string[]; // IDs of connected notes
    isOpen?: boolean;
}

export type GraphEdge = readonly [string, string];

export interface GraphIndex {
    notesById: Map<string, Note>;
    outgoing: Map<string, Set<string>>;
    undirectedNeighbors: Map<string, Set<string>>;
    undirectedEdges: GraphEdge[];
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
    focusedNoteId: string | null;
    setFocusedNote: (id: string | null) => void;
    changeNoteId: (oldId: string, newId: string) => void;
    closeNote: (id: string) => void;
    openNote: (id: string) => void;
}
