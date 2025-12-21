import { Component, ChangeDetectionStrategy } from '@angular/core'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone'

@Component({
  selector: 'app-data',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data.page.html',
})
export class DataPage {}
