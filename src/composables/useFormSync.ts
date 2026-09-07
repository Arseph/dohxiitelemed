import { inject, onBeforeUnmount, ref, type Ref } from 'vue'

/**
 * Collaborative editing for the teleconsultation forms.
 *
 * Two people fill these forms during a call — the doctor, and the medical staff
 * sitting with the patient. The original behaviour was: load a snapshot on mount,
 * then POST every field on save. Whoever saved last overwrote the other's work with
 * their own stale snapshot, silently, including nulling fields they never touched.
 *
 * The model is turn-taking rather than simultaneous editing:
 *
 *  1. Entering edit mode announces it, so the other side sees "X is editing this
 *     form" and knows to wait.
 *  2. Saving sends only the fields that actually changed, so even if both do edit at
 *     once, one person's save cannot blank out the other's columns.
 *  3. After a save, the other side refetches — so both screens always show what is
 *     actually stored, never a local guess.
 *
 * Point 3 overwrites unsaved local edits by design. The alternative — keeping the
 * receiver's in-progress text — leaves the form showing something the database does
 * not contain, which is worse: cancelling out of edit mode would silently reveal
 * that what was on screen was never the record.
 *
 * Split into two pieces because several forms hold more than one model (form2 has
 * clinical history + physical exam, form3 has screening + assessment) but are a
 * single form as far as the user, the drawer card, and the other participant are
 * concerned. One useFormSync per file; one useDirtyTracker per model.
 */

/** Shown when we have no name for the other participant. */
const UNKNOWN_EDITOR = 'Other user'

export interface FormSyncSocket {
  socket: any
  roomId: any
}

/**
 * Tracks what the server last gave us so a save can send only what changed.
 *
 * Comparison is by serialised value, not identity: form3 mutates its array fields
 * in place (addContact, removeScrum, …), so the tracked reference and the live one
 * are the same object and `!==` would report them clean forever — silently dropping
 * every contact and specimen row from the payload.
 */
export function useDirtyTracker(model: Ref<Record<string, any>>, exclude: string[] = []) {
  const committed = ref<Record<string, string>>({})

  /**
   * Whether the server already holds a row for this record.
   *
   * It matters because these tables were created with NOT NULL columns and no
   * defaults. Sending only the changed fields is right for an UPDATE, but on the
   * very first INSERT it omits every column the user never touched — including the
   * ones the fetch pre-filled — and MySQL rejects the row. So the first save sends
   * everything, and only later saves narrow to what actually changed.
   */
  const recordExists = ref(false)


  const encode = (v: any) => JSON.stringify(v ?? null)
  const syncable = (key: string) => !exclude.includes(key)

  /** Record the server's current values. Call after every fetch and every save. */
  function markClean(fields?: Record<string, any>) {
    const source = fields ?? model.value
    const next: Record<string, string> = {}
    for (const key of Object.keys(source))
      next[key] = encode(source[key])

    committed.value = next
  }

  /** Tell the tracker whether the server already has a row. Call from the fetch. */
  function setRecordExists(exists: boolean) {
    recordExists.value = exists
  }

  /**
   * What to send on save: everything when the row still has to be created,
   * otherwise only the fields that differ from what the server last gave us.
   */
  function dirty() {
    const out: Record<string, any> = {}
    for (const key of Object.keys(model.value)) {
      if (!syncable(key))
        continue

      if (!recordExists.value || committed.value[key] !== encode(model.value[key]))
        out[key] = model.value[key]
    }

    return out
  }

  const hasChanges = () => Object.keys(dirty()).length > 0

  return { markClean, dirty, hasChanges, setRecordExists }
}

export interface UseFormSyncOptions {
  /** Stable key identifying this form across both clients, e.g. 'diagnosis_assessment'. */
  form: string
  /** Display name announced to the other participant. */
  editorName?: Ref<string> | (() => string)
  /** Called when the other participant saves. Should refetch, then markClean(). */
  onRemoteSave?: (by: string) => void
}

export function useFormSync(options: UseFormSyncOptions) {
  const { form, editorName, onRemoteSave } = options

  // Provided by VideoConference.vue, which owns the socket. Forms are also opened
  // outside a call, where there is no socket — everything below degrades to a plain
  // form that saves normally and simply has nobody to talk to.
  const conn = inject<FormSyncSocket | null>('formSync', null)

  /** Name of the other participant while they are in edit mode, else null. */
  const remoteEditor = ref<string | null>(null)

  const nameOf = () => {
    if (typeof editorName === 'function')
      return editorName()

    return editorName?.value ?? UNKNOWN_EDITOR
  }

  /** Tell the other side to refetch. Call after a successful save. */
  function notifySaved() {
    conn?.socket?.emit('form-saved', {
      roomId: conn.roomId,
      form,
      by: nameOf(),
    })
  }

  /** Announce entering / leaving edit mode. */
  function setEditing(editing: boolean) {
    conn?.socket?.emit('form-editing', {
      roomId: conn.roomId,
      form,
      by: nameOf(),
      editing,
    })
  }

  // ---- inbound ----

  const onRemoteEditing = (payload: any) => {
    if (!payload)
      return

    // A disconnect sends no form key — clear regardless of which form it was.
    if (payload.editing === false && !payload.form) {
      remoteEditor.value = null

      return
    }

    if (payload.form !== form)
      return

    remoteEditor.value = payload.editing ? (payload.by ?? UNKNOWN_EDITOR) : null
  }

  const onRemoteSaved = (payload: any) => {
    if (!payload || payload.form !== form)
      return

    const by: string = payload.by ?? UNKNOWN_EDITOR

    onRemoteSave?.(by)
  }

  conn?.socket?.on('form-editing', onRemoteEditing)
  conn?.socket?.on('form-saved', onRemoteSaved)

  onBeforeUnmount(() => {
    // Leaving the form counts as leaving edit mode, or the banner stays up.
    setEditing(false)
    conn?.socket?.off('form-editing', onRemoteEditing)
    conn?.socket?.off('form-saved', onRemoteSaved)
  })

  return {
    /** true when a socket is available, i.e. we are inside a call. */
    connected: !!conn?.socket,
    remoteEditor,
    notifySaved,
    setEditing,
  }
}
