import { useRef, MouseEvent, useState, ReactNode } from "react";

interface ResizableDivProps {
  onResizeStart: () => void;
  onResize: (width: number, height: number) => void;
  onResizeEnd: () => void;
  children: ReactNode;
}

export function ResizableDiv({
  onResizeStart,
  onResize,
  onResizeEnd,
  children,
}: ResizableDivProps) {
  const container = useRef<HTMLDivElement>(null);
  const handle = useRef<SVGSVGElement>(null);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });

  const resize = (e: globalThis.MouseEvent) => {
    if (container.current == null) return;

    const width = container.current.offsetWidth;
    const height = container.current.offsetHeight;

    const newWidth = width + (initialMousePos.x - e.clientX);
    const newHeight = height + (initialMousePos.y - e.clientY);

    container.current.style.width = `${newWidth}px`;
    container.current.style.height = `${newHeight}px`;

    onResize(newWidth, newHeight);
  };

  const stopResizing = () => {
    if (handle.current == null) return;

    handle.current.removeEventListener("mousemove", resize);
    handle.current.removeEventListener("mouseup", stopResizing);

    onResizeEnd();
  };

  const startResizing = (e: MouseEvent) => {
    if (handle.current == null) return;

    console.log("hello");

    // setInitialMousePos({
    //   x: e.clientX,
    //   y: e.clientY,
    // });

    // handle.current.addEventListener("mousemove", resize);
    // handle.current.addEventListener("mouseup", stopResizing);

    // onResizeStart();
  };

  return (
    <div ref={container} className="relative">
      {children}
      <svg
        onMouseDown={startResizing}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 absolute right-0 bottom-0"
      >
        <path d="M22.354 9.354l-.707-.707-13 13 .707.707zm0 7l-.707-.707-6 6 .707.707z" />
        <path fill="none" d="M0 0h24v24H0z" />
      </svg>
    </div>
  );
}
