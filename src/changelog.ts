// Shown in the footer's "What's new" dialog, newest first. When you bump the
// version in package.json, add a matching entry here.
export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.6.1',
    date: '2026-10-16',
    changes: [
      'Profile page now shows your telemed details: name, role, designation, facility, license number and contacts.',
      'Edit Profile saves again: personal details, profile photo, username and password.',
      'Activity timeline and signature tab hidden for now.',
      'User management is now reachable from the office network at the server\'s local address, and its login works.',
      'Version in the footer opens this changelog.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-10-16',
    changes: [
      'Call recording disabled for now to avoid filling up system storage. Calls are not recorded.',
      'Ending a call now ends it for the other participant too, and releases the camera and mic.',
      'Request form: changing the facility reloads the doctor list; Reset clears everything.',
      'Login page wording changed from "HRMIS" to "TELEMED".',
      'New user management for superadmins: add, edit, deactivate and delete accounts, reset passwords, and upload photos.',
      'User management only works from the office network, for superadmin accounts.',
      'New admin dashboard with account totals and users by role.',
      'Admin login rebranded as Telemed Management System.',
      'User emails are no longer stored encrypted, fixing garbled emails and email lookups.',
    ],
  },
]
