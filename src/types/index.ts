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

export interface NoteUpdate {
    title?: string;
    content?: string;
    position?: Position;
    size?: Size;
    isOpen?: boolean;
}

export type GraphEdge = readonly [string, string];

export interface GraphIndex {
    notesById: Map<string, Note>;
    outgoing: Map<string, Set<string>>;
    undirectedNeighbors: Map<string, Set<string>>;
    undirectedEdges: GraphEdge[];
}
