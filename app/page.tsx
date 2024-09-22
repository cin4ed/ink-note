"use client";

import { useState, useEffect, useCallback } from "react";
import { Note } from "./components/note";

interface NoteData {
  id: number;
  x: number;
  y: number;
  title?: string;
  content?: string;
}

const initialNotes: NoteData[] = [
  {
    id: 0,
    title: "Domain Driven Design",
    content:
      "Domain Driven Design is a software design approach that emphasizes the importance of understanding the domain model and using it to guide the design of the software system.",
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 300,
  },
  {
    id: 1,
    title: "Entities",
    content:
      "Entities are objects that represent the core of the domain model. They are the main focus of the domain model and are used to represent the core of the domain model.",
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 - 100,
  },
  {
    id: 2,
    title: "Value Objects",
    content:
      "Value Objects are objects that represent the core of the domain model. They are the main focus of the domain model and are used to represent the core of the domain model.",
    x: window.innerWidth / 2 - 200,
    y: window.innerHeight / 2 + 100,
  },
];

export default function Home() {
  const [notes, setNotes] = useState<NoteData[]>(initialNotes);

  const addNote = () => {
    const newId = notes.length;
    const offset = newId * 10; // Offset each new note slightly
    setNotes((prevNotes) => [
      ...prevNotes,
      { id: newId, x: offset, y: offset },
    ]);
  };

  const handleCommandJ = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "j") {
      event.preventDefault();
      addNote();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleCommandJ);
    return () => {
      window.removeEventListener("keydown", handleCommandJ);
    };
  }, [handleCommandJ]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="fixed left-0 right-0 top-0 flex w-full items-center justify-between gap-4 p-4">
        <h1 className="text-xl text-[#6E7069]">Ink Note</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={addNote}
            className="rounded-full border border-[#6E7069] p-2 text-xs text-[#6E7069] transition-colors duration-300 hover:bg-[#6E7069] hover:text-white"
          >
            <kbd>
              <kbd>⌘</kbd>+<kbd>J</kbd>
            </kbd>
            <span> New note</span>
          </button>
          <button className="rounded-full border border-[#6E7069] p-2 text-xs text-[#6E7069] transition-colors duration-300 hover:bg-[#6E7069] hover:text-white">
            <kbd>
              <kbd>⌘</kbd>+<kbd>K</kbd>
            </kbd>
            <span> Search</span>
          </button>
          <button className="rounded-full border border-[#6E7069] p-2 text-xs text-[#6E7069] transition-colors duration-300 hover:bg-[#6E7069] hover:text-white">
            <kbd>
              <kbd>⌘</kbd>+<kbd>L</kbd>
            </kbd>
            <span> Ask</span>
          </button>
        </div>
      </div>
      {notes.map(({ id, x, y, title, content }) => (
        <Note
          key={id}
          id={id}
          x={x}
          y={y}
          title={title}
          content={content}
          onClose={() => {
            setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
          }}
        />
      ))}
    </div>
  );
}
