// Shown in the footer's "What's new" dialog, one tab per version, newest first.
// When you bump the version in package.json, add a matching entry at the top.
export interface ChangelogEntry {
  version: string
  changes: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.7.0',
    changes: [
      'Works on phones: Home, Calendar, Patients, the patient profile, its tabs and all consultation forms now fit small screens.',
      'Video call fills the screen, with bigger buttons and full-width form drawers on phones.',
      'Video call no longer restarts when the window is resized or a tablet is rotated.',
      'Consultation forms become read only once the consultation has finished.',
      '"Remember me" works: ticked keeps you signed in after closing the browser, unticked signs you out when it closes.',
      'Redesigned login page.',
      'Calendar: phones open on an agenda of the week, tapping a day opens it, and the hours shown fit your meetings.',
    ],
  },
  {
    version: '1.6.1',
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
