import { useState } from "react";

import { Rnd } from "react-rnd";
import { DragIcon } from "./drag-icon";

export function Note() {
  const [showDraggableHandle, setShowDraggableHandle] = useState(false);

  return (
    <div>
      <Rnd
        className="border overflow-hidden flex flex-col rounded"
        default={{
          x: 0,
          y: 0,
          width: 200,
          height: 200,
        }}
        dragHandleClassName="drag-handle"
      >
        <div
          className="bg-black text-white flex items-center"
          onMouseOver={() => setShowDraggableHandle(true)}
          onMouseOut={() => setShowDraggableHandle(false)}
        >
          {showDraggableHandle && (
            <div className="cursor-move w-5 flex justify-center drag-handle">
              <DragIcon width={50} height={20} fill="white" />
            </div>
          )}
          <input
            className="flex-1 bg-inherit outline-none px-1"
            type="text"
            placeholder="Untitled"
          />
          <button className="w-10">X</button>
        </div>
        <textarea
          className="flex-1 outline-none resize-none p-1"
          placeholder="Write Something..."
        ></textarea>
      </Rnd>
    </div>
  );
}
