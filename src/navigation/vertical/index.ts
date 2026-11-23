export default [
  {
    title: 'Home',
    to: { name: 'homes.index' },
    icon: { icon: 'tabler-home' },
  },
  {
    title: 'Teleconsultation',
    to: { name: 'tele.index' },
    icon: { icon: 'tabler-video' },
  },
  {
    title: 'Patients',
    to: { name: 'patients.index' },
    icon: { icon: 'tabler-users' },
  },
]

// Added in front of the items above for the users canSeeDashboard allows
export const dashboardNavItems = [
  {
    title: 'Dashboard',
    to: { name: 'dashboard.index' },
    icon: { icon: 'tabler-chart-bar' },
  },
]
