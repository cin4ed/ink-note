/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { v4 as uuidv4 } from "uuid";
import { api } from "../../../convex/_generated/api";
import { useWorkspaceUiStore } from "@/store/useWorkspaceUiStore";
import type { Note, NoteUpdate, Position } from "@/types";

const INITIAL_NOTE_WIDTH = 300;
const INITIAL_NOTE_HEIGHT = 200;

type PendingUpdate = {
  timer: ReturnType<typeof setTimeout>;
  updates: NoteUpdate;
};

interface NotesModel {
  notes: Note[];
  isLoading: boolean;
  addNote: (position?: Position) => Promise<void>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  changeNoteId: (oldId: string, newId: string) => Promise<void>;
  closeNote: (id: string) => Promise<void>;
  openNote: (id: string) => Promise<void>;
}

const NotesModelContext = createContext<NotesModel | null>(null);

const toClientNote = (note: {
  noteId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  position: Position;
  size: { width: number; height: number };
  connections: string[];
  isOpen: boolean;
}): Note => ({
  id: note.noteId,
  title: note.title,
  content: note.content,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  position: note.position,
  size: note.size,
  connections: note.connections,
  isOpen: note.isOpen,
});

const getDefaultPosition = (): Position => ({
  x: window.innerWidth / 2 - INITIAL_NOTE_WIDTH / 2 + (Math.random() * 50 - 25),
  y: window.innerHeight / 2 - INITIAL_NOTE_HEIGHT / 2 + (Math.random() * 50 - 25),
});

export const NotesModelProvider = ({ children }: { children: ReactNode }) => {
  const notesQuery = useQuery(api.notes.listNotes);
  const ensureWelcomeNoteMutation = useMutation(api.notes.ensureWelcomeNote);
  const createNoteMutation = useMutation(api.notes.createNote);
  const updateNoteMutation = useMutation(api.notes.updateNote);
  const openNoteMutation = useMutation(api.notes.openNote);
  const closeNoteMutation = useMutation(api.notes.closeNote);
  const deleteNoteMutation = useMutation(api.notes.deleteNote);
  const changeNoteIdMutation = useMutation(api.notes.changeNoteId);

  const focusedNoteId = useWorkspaceUiStore((state) => state.focusedNoteId);
  const setFocusTarget = useWorkspaceUiStore((state) => state.setFocusTarget);
  const setFocusedNote = useWorkspaceUiStore((state) => state.setFocusedNote);

  const didEnsureWelcomeRef = useRef(false);
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const notesRef = useRef<Note[]>([]);

  const notes = useMemo(() => {
    if (!notesQuery) {
      return [];
    }
    return notesQuery.map(toClientNote);
  }, [notesQuery]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const flushPendingUpdate = useCallback(
    async (id: string) => {
      const entry = pendingUpdatesRef.current.get(id);
      if (!entry) {
        return;
      }

      clearTimeout(entry.timer);
      pendingUpdatesRef.current.delete(id);
      await updateNoteMutation({
        noteId: id,
        updates: {
          title: entry.updates.title,
          content: entry.updates.content,
        },
      });
    },
    [updateNoteMutation],
  );

  const scheduleDebouncedUpdate = useCallback(
    (id: string, updates: NoteUpdate, delayMs: number) => {
      const existing = pendingUpdatesRef.current.get(id);
      if (existing) {
        clearTimeout(existing.timer);
      }

      const mergedUpdates = {
        ...(existing?.updates ?? {}),
        ...updates,
      };

      const timer = setTimeout(() => {
        void flushPendingUpdate(id);
      }, delayMs);

      pendingUpdatesRef.current.set(id, {
        timer,
        updates: mergedUpdates,
      });
    },
    [flushPendingUpdate],
  );

  const addNote = useCallback(
    async (position?: Position) => {
      const id = uuidv4();
      const nextPosition = position ?? getDefaultPosition();
      setFocusTarget(id);
      setFocusedNote(id);
      await createNoteMutation({ noteId: id, position: nextPosition });
    },
    [createNoteMutation, setFocusTarget, setFocusedNote],
  );

  const updateNote = useCallback(
    async (id: string, updates: NoteUpdate) => {
      const contentOrTitleUpdates: NoteUpdate = {};
      const immediateUpdates: NoteUpdate = {};

      if (updates.title !== undefined) {
        contentOrTitleUpdates.title = updates.title;
      }

      if (updates.content !== undefined) {
        contentOrTitleUpdates.content = updates.content;
      }

      if (updates.position !== undefined) {
        immediateUpdates.position = updates.position;
      }

      if (updates.size !== undefined) {
        immediateUpdates.size = updates.size;
      }

      if (updates.isOpen !== undefined) {
        immediateUpdates.isOpen = updates.isOpen;
      }

      if (Object.keys(immediateUpdates).length > 0) {
        await updateNoteMutation({ noteId: id, updates: immediateUpdates });
      }

      if (Object.keys(contentOrTitleUpdates).length > 0) {
        const delayMs = contentOrTitleUpdates.content !== undefined ? 300 : 250;
        scheduleDebouncedUpdate(id, contentOrTitleUpdates, delayMs);
      }
    },
    [scheduleDebouncedUpdate, updateNoteMutation],
  );

  const openNote = useCallback(
    async (id: string) => {
      await flushPendingUpdate(id);

      const note = notesRef.current.find((candidate) => candidate.id === id);
      const shouldCenter = note?.isOpen === false;
      const width = note?.size?.width ?? INITIAL_NOTE_WIDTH;
      const height = note?.size?.height ?? INITIAL_NOTE_HEIGHT;
      const centeredPosition = {
        x: window.innerWidth / 2 - width / 2,
        y: window.innerHeight / 2 - height / 2,
      };

      await openNoteMutation({
        noteId: id,
        ...(shouldCenter ? { position: centeredPosition } : {}),
      });
      setFocusedNote(id);
    },
    [flushPendingUpdate, openNoteMutation, setFocusedNote],
  );

  const closeNote = useCallback(
    async (id: string) => {
      await flushPendingUpdate(id);
      await closeNoteMutation({ noteId: id });
      if (focusedNoteId === id) {
        setFocusedNote(null);
      }
    },
    [closeNoteMutation, flushPendingUpdate, focusedNoteId, setFocusedNote],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await flushPendingUpdate(id);
      await deleteNoteMutation({ noteId: id });
      if (focusedNoteId === id) {
        setFocusedNote(null);
      }
    },
    [deleteNoteMutation, flushPendingUpdate, focusedNoteId, setFocusedNote],
  );

  const changeNoteId = useCallback(
    async (oldId: string, newId: string) => {
      if (oldId === newId) {
        return;
      }

      await flushPendingUpdate(oldId);
      setFocusTarget(newId);
      setFocusedNote(newId);
      await changeNoteIdMutation({ oldNoteId: oldId, newNoteId: newId });
    },
    [changeNoteIdMutation, flushPendingUpdate, setFocusTarget, setFocusedNote],
  );

  useEffect(() => {
    if (notesQuery === undefined || didEnsureWelcomeRef.current) {
      return;
    }

    didEnsureWelcomeRef.current = true;
    void ensureWelcomeNoteMutation({});
  }, [ensureWelcomeNoteMutation, notesQuery]);

  useEffect(() => {
    const openNotes = notes.filter((note) => note.isOpen !== false);
    if (!focusedNoteId) {
      if (openNotes.length > 0) {
        setFocusedNote(openNotes[openNotes.length - 1].id);
      }
      return;
    }

    const focusedStillExists = openNotes.some((note) => note.id === focusedNoteId);
    if (!focusedStillExists) {
      setFocusedNote(openNotes.length > 0 ? openNotes[openNotes.length - 1].id : null);
    }
  }, [focusedNoteId, notes, setFocusedNote]);

  useEffect(() => {
    const pendingUpdates = pendingUpdatesRef.current;
    return () => {
      for (const { timer } of pendingUpdates.values()) {
        clearTimeout(timer);
      }
      pendingUpdates.clear();
    };
  }, []);

  const value = useMemo<NotesModel>(
    () => ({
      notes,
      isLoading: notesQuery === undefined,
      addNote,
      updateNote,
      deleteNote,
      changeNoteId,
      closeNote,
      openNote,
    }),
    [addNote, changeNoteId, closeNote, deleteNote, notes, notesQuery, openNote, updateNote],
  );

  return <NotesModelContext.Provider value={value}>{children}</NotesModelContext.Provider>;
};

export const useNotesModel = () => {
  const context = useContext(NotesModelContext);
  if (!context) {
    throw new Error("useNotesModel must be used within a NotesModelProvider");
  }
  return context;
};

export const useWorkspaceFocus = () => {
  return {
    focusTargetId: useWorkspaceUiStore((state) => state.focusTargetId),
    setFocusTarget: useWorkspaceUiStore((state) => state.setFocusTarget),
    focusedNoteId: useWorkspaceUiStore((state) => state.focusedNoteId),
    setFocusedNote: useWorkspaceUiStore((state) => state.setFocusedNote),
  };
};
