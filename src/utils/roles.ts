// users.level values that see admin-only pages such as the statistics Dashboard.
// Keep in sync with VIEWER_LEVELS in the backend's Tele\DashboardController.
export const ADMIN_LEVELS = ['superadmin']

export const isAdminLevel = (level?: string | null): boolean =>
  !!level && ADMIN_LEVELS.includes(level)

// For now every signed-in user sees the Dashboard. Set to false to limit it to
// ADMIN_LEVELS again, together with OPEN_TO_EVERYONE in the backend controller.
export const DASHBOARD_FOR_EVERYONE = true

export const canSeeDashboard = (level?: string | null): boolean =>
  DASHBOARD_FOR_EVERYONE || isAdminLevel(level)

// The Dashboard tab is hidden from the menu for now. The page still works at
// /dashboard for the users canSeeDashboard allows. Set to true to show the tab.
export const DASHBOARD_TAB_VISIBLE = false

export const showDashboardTab = (level?: string | null): boolean =>
  DASHBOARD_TAB_VISIBLE && canSeeDashboard(level)
