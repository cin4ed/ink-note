import { create } from "zustand";

interface WorkspaceUiState {
  focusTargetId: string | null;
  focusedNoteId: string | null;
  setFocusTarget: (id: string | null) => void;
  setFocusedNote: (id: string | null) => void;
}

export const useWorkspaceUiStore = create<WorkspaceUiState>((set) => ({
  focusTargetId: null,
  focusedNoteId: null,
  setFocusTarget: (id) => set({ focusTargetId: id }),
  setFocusedNote: (id) => set({ focusedNoteId: id }),
}));
