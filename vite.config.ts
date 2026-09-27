import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// A classic inline script also works over file:// without module/CORS requests.
function standaloneHtml(): Plugin {
  return {
    name: 'standalone-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const entries = Object.values(bundle).filter((item) => item.type === 'chunk');
      if (
        entries.length !== 1 ||
        entries[0].type !== 'chunk' ||
        entries[0].imports.length ||
        entries[0].dynamicImports.length
      ) {
        throw new Error('Offline build must contain exactly one self-contained script.');
      }
      const css = Object.values(bundle).filter(
        (item) => item.type === 'asset' && item.fileName.endsWith('.css'),
      );
      const unexpected = Object.values(bundle).filter(
        (item) => item.type === 'asset' && !item.fileName.endsWith('.css'),
      );
      if (unexpected.length)
        throw new Error('Offline build contains external assets; inline them before publishing.');
      const styles = css
        .map((item) => (item.type === 'asset' ? String(item.source) : ''))
        .join('\n')
        .replace(/<\/style/gi, '<\\/style');
      const script = entries[0].code.replace(/<\/script/gi, '<\\/script');
      const template = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
      const html = template
        .replace('</head>', `<style>${styles}</style></head>`)
        .replace(
          /<script\b[^>]*src="\/src\/main\.ts"[^>]*><\/script>/,
          () => `<script>${script}</script>`,
        );
      if (html === template || html.includes('src="/src/main.ts"'))
        throw new Error('HTML entry template was not transformed.');
      for (const name of Object.keys(bundle)) delete bundle[name];
      this.emitFile({ type: 'asset', fileName: 'index.html', source: html });
    },
  };
}
export default defineConfig({
  publicDir: false,
  plugins: [standaloneHtml()],
  build: {
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    lib: { entry: 'src/main.ts', name: 'GPUAtlas', formats: ['iife'] },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
