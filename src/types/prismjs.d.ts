declare module 'prismjs' {
  export function highlightAll(): void;
  export function highlight(text: string, grammar: any, language: string): string;
  export const languages: any;
  export default {
    highlightAll,
    highlight,
    languages
  };
}

declare module 'prismjs/components/prism-javascript';
declare module 'prismjs/components/prism-typescript';
declare module 'prismjs/themes/prism-tomorrow.css';

