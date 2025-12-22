import { DatePipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chevronDown, chevronUp } from 'ionicons/icons'
import { ApiService } from '../services/api.service'
import { PromptUpdate } from '../services/api.types'

interface PromptHistory {
  prompt: string
  timestamp: Date
}

type QueryItem = {
  id: string
  query: string
  result: string
  isLoading: boolean
  error: string | null
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
    IonSpinner,
    IonIcon,
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
    }

    .inputArea {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
    }

    .buttonContainer {
      display: flex;
      gap: 8px;
    }

    .compactProgress {
      margin-top: 8px;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 8px;

      ion-button {
        margin: 0;
        --padding-start: 0;
        --padding-end: 0;
      }
    }

    .progressDetails {
      margin-top: 8px;
      max-height: 200px;
      overflow-y: auto;
    }

    .stepDetail {
      font-family: monospace;
      font-size: 12px;
      padding: 8px;
      background: var(--ion-background-color);
      border-radius: 4px;
      margin: 4px 0;

      pre {
        margin: 4px 0 0 0;
        white-space: pre-wrap;
      }
    }

    .queryList {
      padding: 0 16px;
    }

    .queryListTitle {
      margin: 16px 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .queryCard {
      margin-bottom: 12px;

      ion-card-content {
        padding: 12px;
      }
    }

    .queryContent {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;

      ion-button {
        flex-shrink: 0;
      }
    }

    .queryText {
      flex: 1;
      margin: 0;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .queryResult {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--ion-color-light);

      strong {
        display: block;
        margin-bottom: 8px;
      }

      pre {
        margin: 0;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
        background: var(--ion-color-light);
        padding: 8px;
        border-radius: 4px;
      }
    }

    .queryError {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--ion-color-danger-shade);

      strong {
        display: block;
        margin-bottom: 8px;
        color: var(--ion-color-danger);
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--ion-color-danger-shade);
        background: rgba(var(--ion-color-danger-rgb), 0.1);
        padding: 12px;
        border-radius: 4px;
        border-left: 3px solid var(--ion-color-danger);
      }
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
  result = signal<QueryItem[] | null>(null)
  error = signal<string | null>(null)
  history = signal<PromptHistory[]>([])
  showProgressDetails = signal(false)

  currentStep = computed(() => {
    const allUpdates = this.updates()
    if (allUpdates.length === 0) return ''
    const latest = allUpdates[allUpdates.length - 1]
    return latest.step
  })

  constructor() {
    addIcons({ chevronDown, chevronUp })
  }

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
    this.closeEventSource()

    const url = this.apiService.getPromptUrl(promptText)
    this.eventSource = new EventSource(url)

    this.eventSource.addEventListener('update', (event: MessageEvent) => {
      const update = JSON.parse(event.data) as PromptUpdate
      this.updates.update((updates) => [...updates, update])
    })

    this.eventSource.addEventListener('complete', (event: MessageEvent) => {
      const queries = JSON.parse(event.data) as string[]
      this.result.set(
        queries.map((x) => ({
          id: crypto.randomUUID(),
          query: x,
          result: '',
          isLoading: false,
          error: null,
        }))
      )
      this.loading.set(false)

      // Add to history
      this.history.update((hist) => [
        {
          prompt: promptText,
          timestamp: new Date(),
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
    this.showProgressDetails.set(false)
  }

  loadFromHistory(item: PromptHistory): void {
    this.prompt.set(item.prompt)
    this.updates.set([])
  }

  toggleProgressDetails(): void {
    this.showProgressDetails.update((show) => !show)
  }

  async runQuery(queryItem: QueryItem) {
    this.result.update((items) => {
      const item = items?.find((x) => x.id === queryItem.id)
      if (item) {
        item.isLoading = true
        item.error = null
      }

      return items
    })

    try {
      const res = await this.apiService.runQueries([queryItem.query])

      this.result.update((items) => {
        const item = items?.find((x) => x.id === queryItem.id)
        if (item) {
          item.result = JSON.stringify(res[0], null, 2)
          item.isLoading = false
        }

        return items ? [...items] : null
      })
    } catch (error) {
      this.result.update((items) => {
        const item = items?.find((x) => x.id === queryItem.id)
        if (item) {
          item.error =
            error instanceof Error ? error.message : 'Failed to run query'
          item.isLoading = false
        }

        return items ? [...items] : null
      })
    }
  }
}
