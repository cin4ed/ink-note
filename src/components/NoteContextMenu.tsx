import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

interface NoteContextMenuProps {
  position: { x: number; y: number };
  onDelete: () => void;
  onClose: () => void;
}

export const NoteContextMenu: React.FC<NoteContextMenuProps> = ({
  position,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-200 bg-background border border-card-border rounded-[9px] overflow-hidden py-1 min-w-[140px]"
      style={{ left: position.x, top: position.y }}
    >
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/10 transition-colors"
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>,
    document.body,
  );
};
