import { Component, ChangeDetectionStrategy } from '@angular/core'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone'

@Component({
  selector: 'app-prompt',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prompt.page.html',
})
export class PromptPage {}
