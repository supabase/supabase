import { Context, Effect, Layer } from 'effect'

export class CurrentLocation extends Context.Service<
  CurrentLocation,
  {
    readonly path: Effect.Effect<string>
  }
>()('studio/domain/monitoring/CurrentLocation') {}

export const CurrentLocationLive = Layer.succeed(CurrentLocation, {
  path: Effect.sync(() => window.location.pathname),
})
