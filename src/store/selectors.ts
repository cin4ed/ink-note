import type { AppState, GraphIndex } from '../types';
import { buildGraphIndex } from './graphIndex';

let cachedNotesRef: AppState['notes'] | null = null;
let cachedGraphIndex: GraphIndex = buildGraphIndex([]);

export const selectGraphIndex = (state: AppState): GraphIndex => {
    if (state.notes !== cachedNotesRef) {
        cachedNotesRef = state.notes;
        cachedGraphIndex = buildGraphIndex(state.notes);
    }

    return cachedGraphIndex;
};
