import { Injectable } from '@angular/core'
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router'
import { Observable } from 'rxjs'
import { SupabaseService } from '../services/supabase.service'

@Injectable({
  providedIn: 'root',
})
export class RecoveryPasswordGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService, private readonly router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const result = route.fragment?.split('&').reduce((acc, element) => {
      const [k, v] = element.split('=')
      return { ...acc, [k]: decodeURIComponent(v) }
    }, {})

    // @ts-ignore
    if (result?.type === 'recovery') {
      // @ts-ignore
      this.supabase.token = result.access_token
      this.router.navigate(['/recovery-password'])
      return false
    }
    return true
  }
}
