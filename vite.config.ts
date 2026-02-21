import { defineConfig, type Plugin } from 'npm:vite@6';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from 'tailwindcss';

/**
 * Strip Deno-native npm: specifiers to bare package names so Vite/Rollup
 * can resolve them. @fresh/core imports its deps with npm: prefixes which
 * Vite's CJS resolver cannot handle.
 *
 * Examples:
 *   "npm:preact@^10.27.2"       → "preact"
 *   "npm:@preact/signals@^2.2.1" → "@preact/signals"
 *   "npm:@preact/signals@^2/foo" → "@preact/signals/foo"
 */
function denoNpmSpecifiers(): Plugin {
  return {
    name: 'deno-npm-specifiers',
    resolveId(id) {
      if (!id.startsWith('npm:')) return null;
      const spec = id.slice(4); // strip "npm:"
      let bare: string;
      if (spec.startsWith('@')) {
        // scoped: "@scope/name@version" or "@scope/name@version/sub"
        const parts = spec.split('/');
        // parts[0] = "@scope", parts[1] = "name@version[/sub...]"
        const nameAndVersion = parts[1] ?? '';
        const name = nameAndVersion.replace(/@.+$/, '');
        const sub = parts.slice(2).join('/');
        bare = `${parts[0]}/${name}${sub ? `/${sub}` : ''}`;
      } else {
        // unscoped: "name@version" or "name@version/sub"
        const atIdx = spec.indexOf('@');
        bare = atIdx > 0 ? spec.slice(0, atIdx) : spec;
        const slashAfterAt = spec.indexOf('/', atIdx > 0 ? atIdx : 0);
        if (slashAfterAt > 0) bare += spec.slice(slashAfterAt);
      }
      return this.resolve(bare, undefined, { skipSelf: true });
    },
  };
}

export default defineConfig({
  plugins: [denoNpmSpecifiers(), fresh(), tailwindcss()],
});
