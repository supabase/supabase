import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
}
