import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http'
import { isPlatformBrowser } from '@angular/common'
import { PLATFORM_ID, inject } from '@angular/core'
import { jok } from '@jokio/sdk'
import { from, switchMap } from 'rxjs'

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const platformId = inject(PLATFORM_ID)

  // Exit early if not in browser environment
  if (!isPlatformBrowser(platformId)) {
    return next(req)
  }

  console.log('interceptor', req.url)
  return from(jok.auth.getAccessToken()).pipe(
    switchMap((token) => {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
      return next(authReq)
    })
  )
}
