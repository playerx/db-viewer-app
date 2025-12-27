import { isPlatformBrowser } from '@angular/common'
import { Component, inject, PLATFORM_ID } from '@angular/core'
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone'
import { jok } from '@jokio/sdk'
import { addIcons } from 'ionicons'
import { createOutline, documents } from 'ionicons/icons'
import { environment } from '../../environments/environment.js'
import { IdentityService } from '../services/identity.service.js'
import { MenuService } from '../services/menu.service'
import { StorageService } from '../services/storage.service.js'

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private readonly menuService = inject(MenuService)
  private platformId = inject(PLATFORM_ID)
  private storage = inject(StorageService)
  private identity = inject(IdentityService)

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId)
    if (!isBrowser) {
      return
    }

    ;(window as any).jok = jok

    jok.setup({
      authUrl: environment.authApiUrl,
      storage: this.storage,
    })

    this.identity.load()

    // Initialize menu service
    this.menuService.init()

    addIcons({
      documents,
      createOutline,
    })
  }
}
