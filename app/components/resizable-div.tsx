import React, { useRef, useState, useCallback, useEffect } from "react";

interface ResizableDivProps {
  onResizeStart: () => void;
  onResize: (width: number, height: number) => void;
  onResizeEnd: () => void;
  minWidth?: number;
  minHeight?: number;
  className?: string;
  children: React.ReactNode;
}

export function ResizableDiv({
  onResizeStart,
  onResize,
  onResizeEnd,
  minWidth = 100,
  minHeight = 100,
  className = "",
  children,
}: ResizableDivProps) {
  const container = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      if (!container.current) return;

      setIsResizing(true);
      setInitialMousePos({ x: e.clientX, y: e.clientY });
      setInitialSize({
        width: container.current.offsetWidth,
        height: container.current.offsetHeight,
      });
      if (onResizeStart) onResizeStart();
    },
    [onResizeStart],
  );

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !container.current) return;

      const deltaWidth = e.clientX - initialMousePos.x;
      const deltaHeight = e.clientY - initialMousePos.y;

      const newWidth = Math.max(initialSize.width + deltaWidth, minWidth);
      const newHeight = Math.max(initialSize.height + deltaHeight, minHeight);

      container.current.style.width = `${newWidth}px`;
      container.current.style.height = `${newHeight}px`;

      if (onResize) onResize(newWidth, newHeight);
    },
    [isResizing, initialMousePos, initialSize, minWidth, minHeight, onResize],
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    if (onResizeEnd) onResizeEnd();
  }, [onResizeEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={container}
      className={`relative ${className}`}
      style={{ minWidth, minHeight }}
    >
      {children}
      <div
        className="absolute right-0 bottom-0 w-5 h-5 cursor-nwse-resize"
        onMouseDown={startResizing}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            startResizing(e as unknown as React.MouseEvent);
          }
        }}
        aria-label="Resize"
      >
        <svg
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path d="M22.354 9.354l-.707-.707-13 13 .707.707zm0 7l-.707-.707-6 6 .707.707z" />
          <path fill="none" d="M0 0h24v24H0z" />
        </svg>
      </div>
    </div>
  );
}
