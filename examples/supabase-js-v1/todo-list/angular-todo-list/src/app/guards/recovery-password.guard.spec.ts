import { TestBed } from '@angular/core/testing'

import { RecoveryPasswordGuard } from './recovery-password.guard'
import { RouterTestingModule } from '@angular/router/testing'

describe('RecoveryPasswordGuard', () => {
  let guard: RecoveryPasswordGuard

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
    })
    guard = TestBed.inject(RecoveryPasswordGuard)
  })

  it('should be created', () => {
    expect(guard).toBeTruthy()
  })
})
