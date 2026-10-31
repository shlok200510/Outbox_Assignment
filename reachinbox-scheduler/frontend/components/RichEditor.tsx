'use client';
import { useRef, type ReactNode } from 'react';
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, RedoIcon, UnderlineIcon, UndoIcon } from './icons';

const TOOLS: { cmd: string; label: string; icon: ReactNode }[] = [
  { cmd: 'undo', label: 'Undo', icon: <UndoIcon /> }, { cmd: 'redo', label: 'Redo', icon: <RedoIcon /> },
  { cmd: 'bold', label: 'Bold', icon: <BoldIcon /> }, { cmd: 'italic', label: 'Italic', icon: <ItalicIcon /> },
  { cmd: 'underline', label: 'Underline', icon: <UnderlineIcon /> },
  { cmd: 'insertUnorderedList', label: 'Bulleted list', icon: <ListIcon /> }, { cmd: 'insertOrderedList', label: 'Numbered list', icon: <ListOrderedIcon /> },
];

export function RichEditor({ onChange }: { onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <div className="flex gap-1 border-b border-line/70 bg-white/60 px-2 py-1.5" role="toolbar" aria-label="Formatting">
        {TOOLS.map((t) => (
          <button key={t.cmd} type="button" aria-label={t.label} title={t.label} className="rounded p-1.5 text-ink/70 hover:bg-white"
            onMouseDown={(e) => { e.preventDefault(); document.execCommand(t.cmd); onChange(ref.current?.innerHTML || ''); }}>{t.icon}</button>))}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Message body"
        data-placeholder="Write your email…" onInput={() => onChange(ref.current?.innerHTML || '')}
        className="editor min-h-[18rem] px-4 py-3 text-sm focus:outline-none" />
    </div>
  );
}
