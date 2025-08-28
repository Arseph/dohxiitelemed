import type { App } from 'vue';

/**
 * This is a helper function to register plugins similar to Nuxt.
 * To register a plugin, export a const function `defineVuePlugin` that takes `app` as an argument and calls `app.use`.
 * For scanning plugins, it will include all files in `src/plugins` and `src/plugins/**\/index.ts`.
 *
 * @param {App} app Vue app instance
 *
 * @example
 * ```ts
 * // File: src/plugins/vuetify/index.ts
 *
 * import type { App } from 'vue'
 * import { createVuetify } from 'vuetify'
 *
 * const vuetify = createVuetify({ ... })
 *
 * export default function (app: App) {
 *   app.use(vuetify)
 * }
 * ```
 *
 * All you have to do is use this helper function in `main.ts` file like below:
 * ```ts
 * // File: src/main.ts
 * import { registerPlugins } from '@core/utils/plugins'
 * import { createApp } from 'vue'
 * import App from '@/App.vue'
 *
 * // Create vue app
 * const app = createApp(App)
 *
 * // Register plugins
 * registerPlugins(app) // [!code focus]
 *
 * // Mount vue app
 * app.mount('#app')
 * ```
 */

export const registerPlugins = (app: App) => {
  // Import all plugins except 'axios.ts'
  const imports = import.meta.glob<{ default: (app: App) => void }>(
    ['../../plugins/*.{ts,js}', '../../plugins/*/index.{ts,js}'],
    { eager: true }
  );

  // Filter out 'axios.ts' by checking import paths
  const filteredImports = Object.entries(imports)
    .filter(([path]) => !path.includes('axios.ts'))
    .reduce((acc, [path, module]) => {
      acc[path] = module;
      return acc;
    }, {} as Record<string, { default: (app: App) => void }>);

  // Register each plugin
  Object.values(filteredImports).forEach(pluginImportModule => {
    pluginImportModule.default?.(app);
  });
};
