import { useNotesModel } from '@/features/notes/useNotesModel';
import { BackgroundGraph } from './BackgroundGraph';
import { NoteWindow } from './NoteWindow';

export const WindowManager = () => {
    const { notes } = useNotesModel();

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Background Layer */}
            <BackgroundGraph />

            {/* UI Layer */}
            <div className="relative z-10 w-full h-full pointer-events-none">
                {/* Make children pointer-events-auto */}
                <div className="pointer-events-none w-full h-full">
                    {notes.filter(n => n.isOpen).map((note) => (
                        <NoteWindow key={note.id} note={note} />
                    ))}
                </div>
            </div>
        </div>
    );
};
