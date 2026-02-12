import { Node, mergeAttributes } from '@tiptap/core';

export type CalloutType = 'info' | 'warning' | 'tip' | 'danger';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
      toggleCallout: (attrs?: { type?: CalloutType }) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-callout': '', class: `nbk-callout nbk-callout-${HTMLAttributes['data-callout-type'] || 'info'}` }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (attrs: any) =>
        ({ commands }: any) => {
          return commands.wrapIn(this.name, attrs);
        },
      toggleCallout:
        (attrs: any) =>
        ({ commands }: any) => {
          return commands.toggleWrap(this.name, attrs);
        },
    } as any;
  },
});
