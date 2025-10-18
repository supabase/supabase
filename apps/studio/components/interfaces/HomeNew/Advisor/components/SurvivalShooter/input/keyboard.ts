import type { Vector2 } from '../types'

export class KeyboardInput {
  private keys: Set<string> = new Set()

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  start() {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  stop() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.keys.clear()
  }

  private handleKeyDown(event: KeyboardEvent) {
    this.keys.add(event.key.toLowerCase())
  }

  private handleKeyUp(event: KeyboardEvent) {
    this.keys.delete(event.key.toLowerCase())
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase())
  }

  getMovementVector(): Vector2 {
    let x = 0
    let y = 0

    // WASD movement
    if (this.isKeyPressed('w')) y -= 1
    if (this.isKeyPressed('s')) y += 1
    if (this.isKeyPressed('a')) x -= 1
    if (this.isKeyPressed('d')) x += 1

    // Arrow key movement (alternative)
    if (this.isKeyPressed('arrowup')) y -= 1
    if (this.isKeyPressed('arrowdown')) y += 1
    if (this.isKeyPressed('arrowleft')) x -= 1
    if (this.isKeyPressed('arrowright')) x += 1

    // Normalize diagonal movement so it's not faster
    const length = Math.sqrt(x * x + y * y)
    if (length > 0) {
      x /= length
      y /= length
    }

    return { x, y }
  }
}
