import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, TableProperties, Underline as UnderlineIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableKit } from '@tiptap/extension-table';

interface TemplateRichEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export function TemplateRichEditor({ value, onChange }: TemplateRichEditorProps) {
    const editor = useEditor({
        extensions: [StarterKit, TableKit.configure({ table: { resizable: false } })],
        content: value || '<p></p>',
        onUpdate: ({ editor: currentEditor }) => {
            onChange(currentEditor.isEmpty ? '' : currentEditor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-72 px-3 py-2 text-sm leading-7 outline-none [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:my-2 [&_h3]:font-semibold [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:min-w-24 [&_td]:border [&_td]:p-2 [&_td>p]:my-0 [&_th]:border [&_th]:p-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
            },
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== (value || '<p></p>')) {
            editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
        }
    }, [editor, value]);

    if (!editor) {
        return <div className="min-h-72 rounded-md border bg-background" />;
    }

    const toolbarButtons = [
        {
            label: 'Tebal',
            active: editor.isActive('bold'),
            icon: Bold,
            action: () => editor.chain().focus().toggleBold().run(),
        },
        {
            label: 'Miring',
            active: editor.isActive('italic'),
            icon: Italic,
            action: () => editor.chain().focus().toggleItalic().run(),
        },
        {
            label: 'Garis bawah',
            active: editor.isActive('underline'),
            icon: UnderlineIcon,
            action: () => editor.chain().focus().toggleUnderline().run(),
        },
        {
            label: 'Daftar bernomor',
            active: editor.isActive('orderedList'),
            icon: ListOrdered,
            action: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
            label: 'Daftar bullet',
            active: editor.isActive('bulletList'),
            icon: List,
            action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
            label: 'Sisipkan tabel',
            active: editor.isActive('table'),
            icon: TableProperties,
            action: () => editor.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: false }).run(),
        },
    ];

    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-1">
                {toolbarButtons.map(({ label, active, icon: Icon, action }) => (
                    <Button
                        key={label}
                        type="button"
                        size="icon-sm"
                        variant={active ? 'secondary' : 'ghost'}
                        aria-label={label}
                        aria-pressed={active}
                        title={label}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={action}
                    >
                        <Icon />
                    </Button>
                ))}
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
