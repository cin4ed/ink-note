import { create } from "zustand";

interface WorkspaceUiState {
  focusTargetId: string | null;
  focusedNoteId: string | null;
  zCounter: number;
  noteZIndices: Record<string, number>;
  setFocusTarget: (id: string | null) => void;
  setFocusedNote: (id: string | null) => void;
  bringToFront: (id: string) => void;
}

export const useWorkspaceUiStore = create<WorkspaceUiState>((set) => ({
  focusTargetId: null,
  focusedNoteId: null,
  zCounter: 0,
  noteZIndices: {},
  setFocusTarget: (id) => set({ focusTargetId: id }),
  setFocusedNote: (id) => set({ focusedNoteId: id }),
  bringToFront: (id) =>
    set((state) => {
      const next = state.zCounter + 1;
      return {
        zCounter: next,
        noteZIndices: { ...state.noteZIndices, [id]: next },
        focusedNoteId: id,
      };
    }),
}));
