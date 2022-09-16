import { ComponentFixture, TestBed } from '@angular/core/testing'

import { RecoveryPasswordComponent } from './recovery-password.component'
import { RouterTestingModule } from '@angular/router/testing'
import { ReactiveFormsModule } from '@angular/forms'

describe('RecoveryPasswordComponent', () => {
  let component: RecoveryPasswordComponent
  let fixture: ComponentFixture<RecoveryPasswordComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecoveryPasswordComponent],
      imports: [RouterTestingModule, ReactiveFormsModule],
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoveryPasswordComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
