import { useMemo } from "react";
import { useNotesModel } from "@/features/notes/useNotesModel";

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diffMs = timestamp - now;
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
    { unit: "hour", ms: 1000 * 60 * 60 },
    { unit: "minute", ms: 1000 * 60 },
    { unit: "second", ms: 1000 },
  ];

  for (const { unit, ms } of units) {
    if (absMs >= ms || unit === "second") {
      const value = Math.round(diffMs / ms);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, "second");
};

export const RecentNotes = () => {
  const { notes, openNote } = useNotesModel();

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 10);
  }, [notes]);

  return (
    <div className="fixed top-14 right-4 pointer-events-auto select-none text-foreground">
      <div className="text-sm opacity-60 space-y-2 text-right">
        <div className="text-sm tracking-wider">Recent</div>
        <div className="space-y-1">
          {recentNotes.map((note) => {
            const title = note.title?.trim() || "Untitled";
            return (
              <button
                key={note.id}
                onClick={() => void openNote(note.id)}
                className="block w-full text-right hover:opacity-80 transition-opacity"
                title={title}
              >
                <span className="flex items-baseline justify-end gap-2">
                  <span className="truncate">{title}</span>
                  <span className="text-xs opacity-60 whitespace-nowrap">
                    {formatRelativeTime(note.updatedAt)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
