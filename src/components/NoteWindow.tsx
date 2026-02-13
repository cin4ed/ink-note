import React, { useRef } from "react";
import Draggable from "react-draggable";
import { X } from "lucide-react";
import {
  useNotesModel,
  useWorkspaceFocus,
} from "@/features/notes/useNotesModel";
import { NoteEditor } from "./NoteEditor";
import type { NoteEditorHandle } from "./NoteEditor";
import type { Note } from "../types";

interface NoteWindowProps {
  note: Note;
}

export const NoteWindow: React.FC<NoteWindowProps> = ({ note }) => {
  const { updateNote, closeNote, changeNoteId } = useNotesModel();
  const { focusTargetId, setFocusTarget, bringToFront, noteZIndices } = useWorkspaceFocus();

  const nodeRef = useRef(null);
  const contentRef = useRef<NoteEditorHandle>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const isTitleFocused = useRef(false);
  const [draftTitle, setDraftTitle] = React.useState(note.title);
  const [draftSize, setDraftSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    // Only sync the server title → local draft when the user isn't
    // actively editing, so we never overwrite mid-typing keystrokes.
    if (!isTitleFocused.current) {
      setDraftTitle(note.title);
    }
  }, [note.id, note.title]);

  // Clear the local draft size once the authoritative note.size from the
  // server catches up, so we never snap back to stale dimensions.
  React.useEffect(() => {
    setDraftSize(null);
  }, [note.size?.width, note.size?.height]);

  // Auto-focus title if this note is the focus target (e.g. just created)
  // Auto-focus title if this note is the focus target (e.g. just created)
  React.useEffect(() => {
    if (focusTargetId === note.id && titleRef.current) {
      const timer = setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
        setFocusTarget(null); // Clear target after focus is achieved
      }, 100); // 100ms delay to be safe
      return () => clearTimeout(timer);
    }
  }, [focusTargetId, note.id, setFocusTarget]);

  const handleStart = () => {
    bringToFront(note.id);
  };

  const handleStop = (_e: any, data: { x: number; y: number }) => {
    updateNote(note.id, { position: { x: data.x, y: data.y } });
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    axis: "both" | "x" | "y",
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = note.size?.width || 300;
    const startHeight = note.size?.height || 200;
    let finalWidth = startWidth;
    let finalHeight = startHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (axis !== "y") {
        finalWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
      }
      if (axis !== "x") {
        finalHeight = Math.max(150, startHeight + (moveEvent.clientY - startY));
      }
      setDraftSize({ width: finalWidth, height: finalHeight });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      // Don't clear draftSize here — the useEffect watching note.size
      // will clear it once the server-confirmed size arrives, preventing
      // the snap-back-to-old-size flicker.
      void updateNote(note.id, {
        size: { width: finalWidth, height: finalHeight },
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newId = draftTitle
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-") // Spaces to dashes
        .replace(/[^a-z0-9-]/g, ""); // Remove special chars

      if (newId && newId !== note.id) {
        void changeNoteId(note.id, newId);
      } else {
        // If ID didn't change (or invalid), just move focus to content
        contentRef.current?.focus();
      }
    }
  };

  const handleTitleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={note.position}
      onStart={handleStart}
      onStop={handleStop}
      handle=".drag-handle"
      cancel=".nodrag"
    >
      <div
        ref={nodeRef}
        onMouseDown={() => bringToFront(note.id)}
        onFocusCapture={() => bringToFront(note.id)}
        className="pointer-events-auto absolute bg-[var(--color-background)] border border-card-border flex flex-col overflow-hidden rounded-[9px]"
        style={{
          width: draftSize?.width ?? note.size?.width ?? 300,
          height: draftSize?.height ?? note.size?.height ?? 200,
          zIndex: noteZIndices[note.id] ?? 0,
        }}
      >
        {/* Header / Drag Handle */}
        <div className="flex items-center justify-between p-3 pb-2 border-b border-card-border cursor-move drag-handle group">
          <div className="flex flex-col min-w-0 mr-2">
            <input
              ref={titleRef}
              type="text"
              value={draftTitle}
              onFocus={() => {
                isTitleFocused.current = true;
              }}
              onBlur={() => {
                isTitleFocused.current = false;
              }}
              onChange={(e) => {
                setDraftTitle(e.target.value);
                void updateNote(note.id, { title: e.target.value });
              }}
              onKeyDown={handleTitleKeyDown}
              onDoubleClick={handleTitleDoubleClick}
              style={{
                fieldSizing: "content",
                textBox: "trim-both cap text",
              }}
              className="nodrag font-semibold text-[18px] bg-transparent outline-none text-foreground placeholder-foreground/50 italic"
              placeholder="Title..."
            />
          </div>
          <button
            onClick={() => void closeNote(note.id)}
            className="text-foreground hover:opacity-50 transition-opacity shrink-0 pb-0.5"
            aria-label="Close note"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow w-full overflow-hidden flex flex-col nodrag">
          <NoteEditor
            ref={contentRef}
            initialContent={note.content}
            noteId={note.id}
            onUpdate={(content) => void updateNote(note.id, { content })}
          />
        </div>

        {/* Right edge resize handle */}
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize nodrag z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "x")}
        />

        {/* Bottom edge resize handle */}
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize nodrag z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "y")}
        />

        {/* Bottom-right corner resize handle (invisible) */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize nodrag z-20"
          onMouseDown={(e) => handleResizeMouseDown(e, "both")}
        />
      </div>
    </Draggable>
  );
};
