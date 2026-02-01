import React, { } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { useStore } from '../store/useStore';
import { MentionList } from './MentionList';

interface NoteEditorProps {
    initialContent: string;
    noteId: string;
    onUpdate: (content: string) => void;
    editable?: boolean;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialContent, noteId, onUpdate, editable = true }) => {
    const notes = useStore((state) => state.notes);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
                suggestion: {
                    items: ({ query }) => {
                        return notes
                            .filter(n => n.id !== noteId) // exclude self
                            .filter(n => n.title.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 5); // limit to 5
                    },
                    render: () => {
                        let component: ReactRenderer;
                        let popup: any;

                        return {
                            onStart: (props) => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect as any,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },

                            onUpdate: (props) => {
                                component.updateProps(props);
                                if (!props.clientRect) {
                                    return;
                                }
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },

                            onKeyDown: (props) => {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }
                                // Check if the component ref has onKeyDown
                                const ref = component.ref as any;
                                if (ref && ref.onKeyDown) {
                                    return ref.onKeyDown(props);
                                }
                                return false;
                            },

                            onExit: () => {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            onUpdate(editor.getHTML());
        },
        editable,
        editorProps: {
            attributes: {
                class: 'outline-none h-full w-full font-mono text-sm text-[var(--color-fg)] p-2 prose prose-sm max-w-none'
            }
        }
    });

    // Handle external updates (if multiple people editing, or store updates from elsewhere)
    // Careful with loops here. Only update if valid and different?
    // For now, simpler is better: initial load only.
    // If we need reactivity to store changes (updates from other places), we might need `useEffect`
    // but Tiptap manages its own state. Best to let Tiptap be the source of truth for the local instance.

    return <EditorContent editor={editor} className="flex-grow w-full h-full overflow-y-auto" />;
};
