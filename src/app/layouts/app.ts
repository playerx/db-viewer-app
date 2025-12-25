import { Component, signal } from '@angular/core'
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { createOutline, documents } from 'ionicons/icons'

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('db-viewer-app')

  constructor() {
    addIcons({
      documents,
      createOutline,
    })
  }
}
