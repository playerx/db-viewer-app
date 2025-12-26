import { Component } from '@angular/core'
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chatbubble, documents, calendar, settings } from 'ionicons/icons'

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html',
})
export class TabsPage {
  constructor() {
    addIcons({ chatbubble, documents, calendar, settings })
  }
}
