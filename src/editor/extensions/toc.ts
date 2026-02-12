import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContents: {
      insertTableOfContents: () => ReturnType;
    };
  }
}

export const TableOfContents = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-toc]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-toc': '',
        class: 'nbk-toc-placeholder',
      }),
      'Table of Contents (auto-generated)',
    ];
  },

  addCommands() {
    return {
      insertTableOfContents:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({ type: this.name });
        },
    } as any;
  },
});
