import { Image } from '@tiptap/extension-image';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface ImageUploadOptions {
  uploadFn: (file: File) => Promise<{ url: string; alt?: string }>;
  maxSize?: number;
  allowedTypes?: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      uploadImage: (file: File) => ReturnType;
    };
  }
}

export const ImageUpload = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      uploadFn: async (_file: File) => ({ url: '' }),
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      loading: {
        default: false,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.loading) return {};
          return { 'data-loading': 'true' };
        },
      },
      width: { default: null },
      height: { default: null },
      caption: {
        default: null,
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.caption) return {};
          return { 'data-caption': attributes.caption };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      uploadImage:
        (file: File) =>
        ({ commands, editor }: any) => {
          const opts = this.options as any;
          const { uploadFn, maxSize, allowedTypes } = opts;

          if (maxSize && file.size > maxSize) {
            console.error(`File too large: ${file.size} > ${maxSize}`);
            return false;
          }

          if (allowedTypes && !allowedTypes.includes(file.type)) {
            console.error(`File type not allowed: ${file.type}`);
            return false;
          }

          // Insert placeholder
          const placeholderUrl = URL.createObjectURL(file);
          commands.insertContent({
            type: 'image',
            attrs: { src: placeholderUrl, loading: true, alt: file.name },
          });

          // Upload and replace
          uploadFn(file)
            .then((result: any) => {
              const { state } = editor;
              const { doc } = state;
              let pos: number | null = null;

              doc.descendants((node: any, nodePos: number) => {
                if (node.type.name === 'image' && node.attrs.src === placeholderUrl) {
                  pos = nodePos;
                  return false;
                }
              });

              if (pos !== null) {
                editor.chain().focus().setNodeSelection(pos).updateAttributes('image', {
                  src: result.url,
                  alt: result.alt || file.name,
                  loading: false,
                }).run();
              }

              URL.revokeObjectURL(placeholderUrl);
            })
            .catch((err: any) => {
              console.error('Image upload failed:', err);
              URL.revokeObjectURL(placeholderUrl);
            });

          return true;
        },
    } as any;
  },

  addProseMirrorPlugins() {
    const opts = this.options as any;
    const { uploadFn, maxSize, allowedTypes } = opts;
    const editorRef = this.editor;

    return [
      new Plugin({
        key: new PluginKey('imageUploadDrop'),
        props: {
          handleDOMEvents: {
            drop(view, event) {
              const files = event.dataTransfer?.files;
              if (!files || files.length === 0) return false;

              const imageFiles = Array.from(files).filter((f) =>
                (allowedTypes || []).includes(f.type)
              );

              if (imageFiles.length === 0) return false;

              event.preventDefault();

              for (const file of imageFiles) {
                if (maxSize && file.size > maxSize) continue;
                editorRef.commands.uploadImage(file);
              }

              return true;
            },
            paste(view, event) {
              const files = event.clipboardData?.files;
              if (!files || files.length === 0) return false;

              const imageFiles = Array.from(files).filter((f) =>
                (allowedTypes || []).includes(f.type)
              );

              if (imageFiles.length === 0) return false;

              event.preventDefault();

              for (const file of imageFiles) {
                if (maxSize && file.size > maxSize) continue;
                editorRef.commands.uploadImage(file);
              }

              return true;
            },
          },
        },
      }),
    ];
  },
});
