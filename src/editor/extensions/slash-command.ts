import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor) => void;
}

export const defaultSlashCommands: SlashCommandItem[] = [
  {
    title: 'Heading 2',
    description: 'Large section heading',
    icon: 'H2',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Medium section heading',
    icon: 'H3',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Heading 4',
    description: 'Small section heading',
    icon: 'H4',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: '•',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: '1.',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    description: 'Create a checklist',
    icon: '☑',
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Blockquote',
    description: 'Add a quote block',
    icon: '"',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Add a code snippet',
    icon: '</>',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Divider',
    description: 'Add a horizontal divider',
    icon: '—',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Image',
    description: 'Upload or embed an image',
    icon: '🖼',
    command: (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          editor.commands.uploadImage(file);
        }
      };
      input.click();
    },
  },
  {
    title: 'Table',
    description: 'Add a table',
    icon: '⊞',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Callout',
    description: 'Add an info callout box',
    icon: 'ℹ',
    command: (editor) => editor.chain().focus().setCallout({ type: 'info' }).run(),
  },
  {
    title: 'FAQ',
    description: 'Add a FAQ section',
    icon: '?',
    command: (editor) => editor.chain().focus().insertFAQ().run(),
  },
  {
    title: 'Table of Contents',
    description: 'Auto-generated from headings',
    icon: '≡',
    command: (editor) => editor.chain().focus().insertTableOfContents().run(),
  },
];

export interface SlashCommandState {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number } | null;
  selectedIndex: number;
  items: SlashCommandItem[];
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      commands: defaultSlashCommands,
      onStateChange: (_state: SlashCommandState) => {},
    };
  },

  addStorage() {
    return {
      deleteSlashAndRun: (_item: SlashCommandItem) => {},
    };
  },

  addProseMirrorPlugins() {
    const { commands, onStateChange } = this.options;
    const editorRef = this.editor;
    const storage = this.editor.storage.slashCommand;

    let state: SlashCommandState = {
      isOpen: false,
      query: '',
      position: null,
      selectedIndex: 0,
      items: commands,
    };

    function updateState(partial: Partial<SlashCommandState>) {
      state = { ...state, ...partial };
      onStateChange(state);
    }

    function deleteSlashText(view: any) {
      const { $from } = view.state.selection;
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const slashIndex = textBefore.lastIndexOf('/');
      if (slashIndex >= 0) {
        const start = $from.start() + slashIndex;
        const end = $from.pos;
        view.dispatch(view.state.tr.delete(start, end));
      }
    }

    // Expose a method for the click handler to call
    storage.deleteSlashAndRun = (item: SlashCommandItem) => {
      deleteSlashText(editorRef.view);
      item.command(editorRef);
      updateState({ isOpen: false, query: '', selectedIndex: 0 });
    };

    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown(view, event) {
            if (!state.isOpen) {
              return false;
            }

            // Menu is open
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              updateState({
                selectedIndex: (state.selectedIndex + 1) % state.items.length,
              });
              return true;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              updateState({
                selectedIndex:
                  (state.selectedIndex - 1 + state.items.length) % state.items.length,
              });
              return true;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              const item = state.items[state.selectedIndex];
              if (item) {
                deleteSlashText(view);
                item.command(editorRef);
              }
              updateState({ isOpen: false, query: '', selectedIndex: 0 });
              return true;
            }

            if (event.key === 'Escape') {
              updateState({ isOpen: false, query: '', selectedIndex: 0 });
              return true;
            }

            return false;
          },

          handleTextInput(view, from, _to, text) {
            const { $from } = view.state.selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset) + text;

            const slashIndex = textBefore.lastIndexOf('/');
            if (slashIndex >= 0) {
              const query = textBefore.slice(slashIndex + 1).toLowerCase();
              const filtered = commands.filter(
                (cmd: SlashCommandItem) =>
                  cmd.title.toLowerCase().includes(query) ||
                  cmd.description.toLowerCase().includes(query)
              );

              if (filtered.length > 0) {
                const coords = view.coordsAtPos(from);
                updateState({
                  isOpen: true,
                  query,
                  position: { top: coords.bottom + 4, left: coords.left },
                  items: filtered,
                  selectedIndex: 0,
                });
              } else {
                updateState({ isOpen: false, query: '', selectedIndex: 0 });
              }
            } else if (state.isOpen) {
              updateState({ isOpen: false, query: '', selectedIndex: 0 });
            }

            return false;
          },
        },
      }),
    ];
  },
});
