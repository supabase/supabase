import { Component, effect, inject, input, Input, output } from '@angular/core'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
  imports: [],
})
export class AvatarComponent {
  _avatarUrl: SafeResourceUrl | undefined
  uploading = false
  avatarUrl = input<string>()

  constructor() {
    effect(() => {
      const url = this.avatarUrl()
      if (url) {
        this.downloadImage(url)
      }
    })
  }

  readonly upload = output<string>();

  private readonly supabase = inject(SupabaseService)
  private readonly dom = inject(DomSanitizer)

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.downLoadImage(path)
      if (data instanceof Blob) {
        this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(URL.createObjectURL(data))
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading image: ', error.message)
      }
    }
  }

  async uploadAvatar(event: any) {
    try {
      this.uploading = true
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${Math.random()}.${fileExt}`

      await this.supabase.uploadAvatar(filePath, file)
      this.upload.emit(filePath)
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.uploading = false
    }
  }
}
