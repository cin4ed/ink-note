import { useState } from "react";

import { Rnd } from "react-rnd";
import { DragIcon } from "./drag-icon";
import { CloseButtonIcon } from "./close-button-icon";
interface NoteProps {
  id: number;
  x: number;
  y: number;
  title?: string;
  content?: string;
  onClose: () => void;
}

export function Note({ id, x, y, title, content, onClose }: NoteProps) {
  const [showDraggableHandle, setShowDraggableHandle] = useState(false);
  const [noteTitle, setNoteTitle] = useState(title || "Untitled");
  const [noteContent, setNoteContent] = useState(content || "");

  return (
    <Rnd
      className="overflow-hidden rounded-lg border border-[#D9D9D0]"
      default={{
        x,
        y,
        width: 400,
        height: 200,
      }}
      dragHandleClassName="drag-handle"
    >
      <div className="flex h-full flex-col">
        <div
          className="flex items-center bg-[#6E7069] pr-1.5"
          onMouseOver={() => setShowDraggableHandle(true)}
          onMouseOut={() => setShowDraggableHandle(false)}
        >
          {showDraggableHandle && (
            <div className="drag-handle flex w-5 cursor-move justify-center">
              <DragIcon width={50} height={20} className="fill-[#E7E6DD]" />
            </div>
          )}
          <input
            className="flex-1 bg-inherit pl-1.5 font-medium text-[#EFEDE7] outline-none"
            type="text"
            placeholder="Untitled"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <button onClick={onClose}>
            <CloseButtonIcon
              width={15}
              height={15}
              className="fill-[#EFEDE7] hover:fill-[#CACAC1]"
            />
          </button>
        </div>
        <textarea
          className="flex-1 resize-none bg-[#F7F6F3] p-1.5 text-[#454744] outline-none"
          placeholder="Write Something..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        ></textarea>
      </div>
    </Rnd>
  );
}
