import { Component, inject, signal } from '@angular/core'
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { createOutline, documents } from 'ionicons/icons'
import { MenuService } from '../services/menu.service'

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
})
export class App {
  private readonly menuService = inject(MenuService)
  protected readonly title = signal('db-viewer-app')

  constructor() {
    addIcons({
      documents,
      createOutline,
    })

    // Initialize menu service
    this.menuService.init()
  }
}
