import type { GraphIndex, Note } from '../types';

export const buildGraphIndex = (notes: Note[]): GraphIndex => {
    const notesById = new Map<string, Note>();
    const outgoing = new Map<string, Set<string>>();
    const undirectedNeighbors = new Map<string, Set<string>>();
    const undirectedEdges: GraphIndex['undirectedEdges'] = [];
    const seenUndirectedEdges = new Set<string>();

    for (const note of notes) {
        notesById.set(note.id, note);
        outgoing.set(note.id, new Set());
        undirectedNeighbors.set(note.id, new Set());
    }

    for (const note of notes) {
        const sourceId = note.id;
        const sourceOutgoing = outgoing.get(sourceId);
        const sourceNeighbors = undirectedNeighbors.get(sourceId);

        if (!sourceOutgoing || !sourceNeighbors) {
            continue;
        }

        const rawConnections = Array.isArray(note.connections) ? note.connections : [];

        for (const targetId of rawConnections) {
            if (typeof targetId !== 'string') {
                continue;
            }
            if (targetId === sourceId) {
                continue;
            }
            if (!notesById.has(targetId)) {
                continue;
            }

            sourceOutgoing.add(targetId);
            sourceNeighbors.add(targetId);
            undirectedNeighbors.get(targetId)?.add(sourceId);

            const [a, b] = sourceId < targetId ? [sourceId, targetId] : [targetId, sourceId];
            const edgeKey = `${a}|${b}`;
            if (seenUndirectedEdges.has(edgeKey)) {
                continue;
            }

            seenUndirectedEdges.add(edgeKey);
            undirectedEdges.push([a, b]);
        }
    }

    return {
        notesById,
        outgoing,
        undirectedNeighbors,
        undirectedEdges,
    };
};
