/** One queue per provider, discarded on project, account, or backend changes. */
export class ConversationPersistence {
  private pending = new Map<string, Promise<void>>()
  private disposed = false

  constructor(private onError: (error: unknown) => void) {}

  enqueue(id: string, work: () => Promise<void>): Promise<void> {
    const previous = this.pending.get(id) ?? Promise.resolve()
    const next = previous.then(async () => {
      this.assertActive()
      await work()
      this.assertActive()
    })
    this.pending.set(id, next)
    // Keep rejection in the queue: subsequent sends fail until an explicit reload.
    void next.catch((error) => {
      if (!this.disposed) this.onError(error)
    })
    return next
  }

  async ready(id: string) {
    this.assertActive()
    await this.pending.get(id)
    this.assertActive()
  }

  assertActive() {
    if (this.disposed) throw new Error('The assistant context changed. Reopen the conversation.')
  }

  dispose() {
    this.disposed = true
  }
}
