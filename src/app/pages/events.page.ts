import { Component, ChangeDetectionStrategy } from '@angular/core'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone'

@Component({
  selector: 'app-events',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './events.page.html',
})
export class EventsPage {}
