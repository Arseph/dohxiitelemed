import 'vue-router'

// Injected by vite.config.ts `define`
declare global {
  const __APP_VERSION__: string
  const __APP_COMMIT__: string
}

declare module 'vue-router' {
  interface RouteMeta {
    action?: string
    subject?: string
    layoutWrapperClasses?: string
    navActiveLink?: RouteLocationRaw
    layout?: 'blank' | 'default'
    unauthenticatedOnly?: boolean
    public?: boolean
  }
}
