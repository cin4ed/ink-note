import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

interface MentionListProps {
    items: any[];
    command: (item: any) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command({ id: item.id, label: item.title });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (props.items.length === 0) {
        return null;
    }

    return (
        <div className="bg-[var(--color-bg)] border border-[var(--color-fg)] shadow-[4px_4px_0px_var(--color-fg)] overflow-hidden min-w-[150px] p-1 flex flex-col gap-1">
            {props.items.map((item, index) => (
                <button
                    className={`text-left px-2 py-1 text-sm font-mono w-full transition-colors truncate
            ${index === selectedIndex ? 'bg-[var(--color-fg)] text-[var(--color-bg)]' : 'text-[var(--color-fg)] hover:bg-[var(--color-fg)]/10'}
          `}
                    key={index}
                    onClick={() => selectItem(index)}
                >
                    {item.title || "Untitled"}
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = 'MentionList';
