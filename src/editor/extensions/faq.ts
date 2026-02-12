import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    faq: {
      insertFAQ: () => ReturnType;
    };
    faqQuestion: Record<string, never>;
    faqAnswer: Record<string, never>;
  }
}

export const FAQItem = Node.create({
  name: 'faqItem',
  group: 'block',
  content: 'faqQuestion faqAnswer',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-faq-item]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-faq-item': '', class: 'nbk-faq-item' }), 0];
  },
});

export const FAQQuestion = Node.create({
  name: 'faqQuestion',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-faq-question]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-faq-question': '', class: 'nbk-faq-question' }), 0];
  },
});

export const FAQAnswer = Node.create({
  name: 'faqAnswer',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-faq-answer]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-faq-answer': '', class: 'nbk-faq-answer' }), 0];
  },
});

export const FAQ = Node.create({
  name: 'faq',
  group: 'block',
  content: 'faqItem+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-faq]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-faq': '', class: 'nbk-faq' }), 0];
  },

  addCommands() {
    return {
      insertFAQ:
        () =>
        ({ chain }: any) => {
          return chain()
            .insertContent({
              type: 'faq',
              content: [
                {
                  type: 'faqItem',
                  content: [
                    { type: 'faqQuestion', content: [{ type: 'text', text: 'Question?' }] },
                    { type: 'faqAnswer', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Answer.' }] }] },
                  ],
                },
              ],
            })
            .run();
        },
    } as any;
  },
});
