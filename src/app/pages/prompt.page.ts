import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnDestroy,
} from '@angular/core'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
} from '@ionic/angular/standalone'
import { FormsModule } from '@angular/forms'
import { DatePipe } from '@angular/common'
import { ApiService } from '../services/api.service'
import { PromptUpdate, PromptComplete, DebugStep } from '../models/api.types'

interface PromptHistory {
  prompt: string
  result: string
  timestamp: Date
  debug?: DebugStep[]
}

@Component({
  selector: 'app-prompt',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonTextarea,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    FormsModule,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prompt.page.html',
  styles: `
    .promptContainer {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .inputArea {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .updateCard {
      margin-bottom: 8px;
    }

    .debugStep {
      font-family: monospace;
      font-size: 12px;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 4px;
      margin: 4px 0;
    }

    .resultCard {
      background: var(--ion-color-success-tint);
    }

    .historyItem {
      cursor: pointer;
    }

    .timestamp {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
  `,
})
export class PromptPage implements OnDestroy {
  private readonly apiService = inject(ApiService)
  private eventSource: EventSource | null = null

  prompt = signal('')
  loading = signal(false)
  updates = signal<PromptUpdate[]>([])
  result = signal<string | null>(null)
  error = signal<string | null>(null)
  history = signal<PromptHistory[]>([])
  showDebug = signal(false)
  debugSteps = signal<DebugStep[]>([])

  ngOnDestroy(): void {
    this.closeEventSource()
  }

  executePrompt(): void {
    const promptText = this.prompt().trim()
    if (!promptText) return

    this.loading.set(true)
    this.error.set(null)
    this.result.set(null)
    this.updates.set([])
    this.debugSteps.set([])
    this.closeEventSource()

    const url = this.apiService.getPromptUrl(promptText)
    this.eventSource = new EventSource(url)

    this.eventSource.addEventListener('update', (event: MessageEvent) => {
      const update = JSON.parse(event.data) as PromptUpdate
      this.updates.update(updates => [...updates, update])
    })

    this.eventSource.addEventListener('complete', (event: MessageEvent) => {
      const complete = JSON.parse(event.data) as PromptComplete
      this.result.set(complete.result)
      this.debugSteps.set(complete.debug || [])
      this.loading.set(false)

      // Add to history
      this.history.update(hist => [
        {
          prompt: promptText,
          result: complete.result,
          timestamp: new Date(),
          debug: complete.debug,
        },
        ...hist,
      ])

      this.closeEventSource()
    })

    this.eventSource.addEventListener('error', (event: Event) => {
      const messageEvent = event as MessageEvent
      if (messageEvent.data) {
        try {
          const errorData = JSON.parse(messageEvent.data)
          this.error.set(errorData.error || 'An error occurred')
        } catch {
          this.error.set('Failed to execute prompt')
        }
      } else {
        this.error.set('Connection error')
      }
      this.loading.set(false)
      this.closeEventSource()
    })

    this.eventSource.onerror = () => {
      if (this.loading()) {
        this.error.set('Connection to server lost')
        this.loading.set(false)
      }
      this.closeEventSource()
    }
  }

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  clearPrompt(): void {
    this.prompt.set('')
    this.result.set(null)
    this.error.set(null)
    this.updates.set([])
    this.debugSteps.set([])
  }

  loadFromHistory(item: PromptHistory): void {
    this.prompt.set(item.prompt)
    this.result.set(item.result)
    this.debugSteps.set(item.debug || [])
    this.updates.set([])
  }

  toggleDebug(): void {
    this.showDebug.update(show => !show)
  }
}
