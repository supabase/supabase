import { Component, inject, OnInit, input } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { User } from '@supabase/supabase-js'
import { Profile, SupabaseService } from '../supabase.service'

import { AvatarComponent } from '../avatar/avatar.component'

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  imports: [AvatarComponent, ReactiveFormsModule],
})
export class AccountComponent implements OnInit {
  loading = false
  profile!: Profile
  updateProfileForm!: FormGroup

  get avatarUrl() {
    return this.updateProfileForm.value.avatar_url as string
  }

  async updateAvatar(event: string): Promise<void> {
    this.updateProfileForm.patchValue({
      avatar_url: event,
    })
    await this.updateProfile()
  }

  readonly user = input.required<User>();

  private readonly supabase = inject(SupabaseService)
  private readonly formBuilder = inject(FormBuilder)

  constructor() {
    this.updateProfileForm = this.formBuilder.group({
      username: '',
      website: '',
      avatar_url: '',
    })
  }

  async ngOnInit(): Promise<void> {
    await this.getProfile()

    const { username, website, avatar_url } = this.profile
    this.updateProfileForm.patchValue({
      username,
      website,
      avatar_url,
    })
  }

  async getProfile() {
    try {
      this.loading = true
      const { data: profile, error, status } = await this.supabase.profile(this.user())

      if (error && status !== 406) {
        throw error
      }

      if (profile) {
        this.profile = profile
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }

  async updateProfile(): Promise<void> {
    try {
      this.loading = true

      const username = this.updateProfileForm.value.username as string
      const website = this.updateProfileForm.value.website as string
      const avatar_url = this.updateProfileForm.value.avatar_url as string

      const { error } = await this.supabase.updateProfile({
        id: this.user().id,
        username,
        website,
        avatar_url,
      })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }

  async signOut() {
    await this.supabase.signOut()
  }
}
