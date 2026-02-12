'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

import { ImageUpload } from './extensions/image-upload';
import { Callout } from './extensions/callout';
import { FAQ, FAQItem, FAQQuestion, FAQAnswer } from './extensions/faq';
import { TableOfContents } from './extensions/toc';
import { CodeBlockEnhanced } from './extensions/code-block';
import { SlashCommand, type SlashCommandState, type SlashCommandItem } from './extensions/slash-command';

export interface BlogEditorProps {
  content?: Record<string, unknown>;
  onChange?: (content: Record<string, unknown>) => void;
  onSave?: (content: Record<string, unknown>) => void;
  uploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
  placeholder?: string;
  autosaveInterval?: number;
  className?: string;
}

export function BlogEditor({
  content,
  onChange,
  onSave,
  uploadImage,
  placeholder = 'Start writing your post... Type "/" for commands',
  autosaveInterval = 30000,
  className = '',
}: BlogEditorProps) {
  const [slashState, setSlashState] = useState<SlashCommandState>({
    isOpen: false,
    query: '',
    position: null,
    selectedIndex: 0,
    items: [],
  });
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef<string>('');

  const defaultUpload = useCallback(async (file: File) => {
    if (!uploadImage) {
      return { url: URL.createObjectURL(file), alt: file.name };
    }
    return uploadImage(file);
  }, [uploadImage]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: { color: '#2563eb', width: 2 },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'nbk-link' } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageUpload.configure({ uploadFn: defaultUpload } as any),
      CodeBlockEnhanced,
      Callout,
      FAQ,
      FAQItem,
      FAQQuestion,
      FAQAnswer,
      TableOfContents,
      SlashCommand.configure({
        onStateChange: setSlashState,
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    },
    editorProps: {
      attributes: {
        class: `nbk-editor-content ${className}`,
      },
    },
  });

  // Autosave
  useEffect(() => {
    if (!onSave || !autosaveInterval || !editor) return;

    autosaveTimerRef.current = setInterval(() => {
      const json = JSON.stringify(editor.getJSON());
      if (json !== lastSavedRef.current) {
        setIsSaving(true);
        onSave(editor.getJSON());
        lastSavedRef.current = json;
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, autosaveInterval);

    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, [editor, onSave, autosaveInterval]);

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="nbk-editor">
      {/* Toolbar */}
      {editor && (
        <div className="nbk-editor-toolbar">
          <div className="nbk-toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Underline"
            >
              <u>U</u>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Inline Code"
            >
              {'</>'}
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Highlight"
            >
              H
            </button>
          </div>

          <div className="nbk-toolbar-divider" />

          <div className="nbk-toolbar-group">
            {[2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run()}
                className={editor.isActive('heading', { level }) ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
                title={`Heading ${level}`}
              >
                H{level}
              </button>
            ))}
          </div>

          <div className="nbk-toolbar-divider" />

          <div className="nbk-toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Bullet List"
            >
              &#8226;
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Numbered List"
            >
              1.
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Task List"
            >
              &#9745;
            </button>
          </div>

          <div className="nbk-toolbar-divider" />

          <div className="nbk-toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Quote"
            >
              &ldquo;
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Code Block"
            >
              {'{ }'}
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="nbk-toolbar-btn"
              title="Divider"
            >
              &mdash;
            </button>
            <button
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="nbk-toolbar-btn"
              title="Table"
            >
              &#8862;
            </button>
          </div>

          <div className="nbk-toolbar-divider" />

          <div className="nbk-toolbar-group">
            <button
              onClick={() => {
                const url = window.prompt('Enter URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              className={editor.isActive('link') ? 'nbk-toolbar-btn active' : 'nbk-toolbar-btn'}
              title="Link"
            >
              &#128279;
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (file) editor.commands.uploadImage(file);
                };
                input.click();
              }}
              className="nbk-toolbar-btn"
              title="Upload Image"
            >
              &#128247;
            </button>
          </div>
        </div>
      )}

      {/* Bubble Menu */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="nbk-bubble-menu">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}>B</button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}>I</button>
            <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'active' : ''}>{'</>'}</button>
            <button
              onClick={() => {
                const url = window.prompt('Enter URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}
              className={editor.isActive('link') ? 'active' : ''}
            >
              Link
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Slash Command Menu */}
      {slashState.isOpen && slashState.position && (
        <div
          className="nbk-slash-menu"
          style={{
            position: 'fixed',
            top: slashState.position.top,
            left: slashState.position.left,
          }}
        >
          {slashState.items.map((item: SlashCommandItem, index: number) => (
            <button
              key={item.title}
              className={`nbk-slash-item ${index === slashState.selectedIndex ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                editor!.storage.slashCommand.deleteSlashAndRun(item);
              }}
            >
              <span className="nbk-slash-icon">{item.icon}</span>
              <div>
                <div className="nbk-slash-title">{item.title}</div>
                <div className="nbk-slash-desc">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className="nbk-editor-status">
        <span>{wordCount} words</span>
        <span>{readingTime} min read</span>
        {isSaving && <span className="nbk-saving">Saving...</span>}
      </div>
    </div>
  );
}
