import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'

import { routes } from './app.routes'
import { authInterceptor } from './common/auth.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideIonicAngular({ mode: 'ios' }),
  ],
}
