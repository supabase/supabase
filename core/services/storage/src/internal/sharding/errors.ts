export class NoActiveShardError extends Error {
  constructor(kind: string) {
    super(`No active shards for kind=${kind}`)
    this.name = 'NoActiveShardError'
  }
}

export class NoCapacityError extends Error {
  constructor() {
    super('No capacity left on any active shard')
    this.name = 'NoCapacityError'
  }
}

export class ReservationNotFoundError extends Error {
  constructor() {
    super('Reservation not found')
    this.name = 'ReservationNotFoundError'
  }
}

export class InvalidReservationStatusError extends Error {
  constructor(status: string) {
    super(`Reservation status is ${status}`)
    this.name = 'InvalidReservationStatusError'
  }
}

export class ExpiredReservationError extends Error {
  constructor() {
    super('Reservation lease expired or slot no longer held')
    this.name = 'ExpiredReservationError'
  }
}
