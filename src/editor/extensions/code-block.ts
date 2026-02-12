import CodeBlockLowlight from '@tiptap/extension-code-block';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeBlockEnhanced: {
      setCodeBlock: (attrs?: { language?: string }) => ReturnType;
      toggleCodeBlock: (attrs?: { language?: string }) => ReturnType;
    };
  }
}

export const CodeBlockEnhanced = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: 'plaintext',
        parseHTML: (element) =>
          element.getAttribute('data-language') ||
          element.querySelector('code')?.className?.replace('language-', '') ||
          'plaintext',
        renderHTML: (attributes) => ({
          'data-language': attributes.language,
        }),
      },
      filename: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-filename'),
        renderHTML: (attributes) => {
          if (!attributes.filename) return {};
          return { 'data-filename': attributes.filename };
        },
      },
    };
  },
});

export const SUPPORTED_LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'html',
  'css',
  'scss',
  'json',
  'python',
  'rust',
  'go',
  'java',
  'kotlin',
  'swift',
  'ruby',
  'php',
  'c',
  'cpp',
  'csharp',
  'sql',
  'bash',
  'shell',
  'yaml',
  'toml',
  'markdown',
  'graphql',
  'docker',
  'nginx',
];
