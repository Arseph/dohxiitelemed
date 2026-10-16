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
      'Version in the footer opens this changelog.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-10-16',
    changes: [
      'Ending a call now ends it for the other participant too, and releases the camera and mic.',
      'Recording is off unless the host turns it on; the other side sees a "being recorded" notice and both voices are recorded.',
      'Request form: changing the facility reloads the doctor list; Reset clears everything.',
      'Login page wording changed from "HRMIS" to "TELEMED".',
    ],
  },
]
