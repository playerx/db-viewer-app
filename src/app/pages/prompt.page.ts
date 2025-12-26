import { DatePipe, isPlatformBrowser } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonNote,
  IonSpinner,
  IonSplitPane,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { EJSON, ObjectId } from 'bson'
import { addIcons } from 'ionicons'
import {
  bulb,
  checkmarkCircle,
  chevronDown,
  chevronUp,
  clipboard,
  closeCircle,
  menuOutline,
  pin,
  pinOutline,
  timeOutline,
} from 'ionicons/icons'
import { ApiService } from '../services/api.service'
import { DocumentData, PromptLog, PromptUpdate } from '../services/api.types'
import { StorageService } from '../services/storage.service'

type QueryItem = {
  id: string
  promptLogId: string
  query: string
  result: string
  resultData: any | null
  collection: string | null
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
    IonNote,
    IonSpinner,
    IonIcon,
    IonSplitPane,
    IonMenu,
    IonMenuButton,
    FormsModule,
    DatePipe,
    IonCardSubtitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './prompt.page.html',
  styles: `

    .promptMenu {
      ion-toolbar {
        ion-title {
          padding-inline: unset;

          div {
            display: flex;
            align-items: center;
            justify-content: center;

            ion-icon {
              margin-right: 5px;
            }
          }
        }

        .pinButton {
          --padding-start: 8px;
          --padding-end: 8px;
          margin-right: 8px;
          z-index: 1000;

          ion-icon {
            font-size: 31px;
            transition: all 0.2s ease;
          }
        }
      }
    }

    .promptContainer {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 24px;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
    }

    .inputArea {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background: var(--ion-background-color);
      border-bottom: 1px solid var(--ion-color-light);

      ion-textarea {
        --background: var(--ion-color-light);
        --padding-start: 16px;
        --padding-end: 16px;
        --padding-top: 12px;
        --padding-bottom: 12px;
        --border-radius: 12px;
        border-radius: 12px;
        font-size: 15px;
        transition: all 0.2s ease;

        &::part(native) {
          min-height: 80px;
        }

        &:focus-within {
          --background: var(--ion-color-light-tint);
          box-shadow: 0 0 0 2px var(--ion-color-primary);
        }
      }
    }

    .buttonContainer {
      display: flex;
      gap: 12px;

      ion-button {
        font-weight: 600;
        letter-spacing: 0.3px;
        --border-radius: 10px;
        text-transform: none;

        &[expand='block'] {
          flex: 1;
        }
      }
    }

    .compactProgress {
      margin-top: 12px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 12px;
      border: 1px solid var(--ion-color-primary-shade);
      animation: pulse 2s ease-in-out infinite;

      ion-button {
        margin: 0;
        --padding-start: 0;
        --padding-end: 0;
        font-weight: 500;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.9;
      }
    }

    .progressDetails {
      margin-top: 12px;
      max-height: 250px;
      overflow-y: auto;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 250px;
      }
    }

    .stepDetail {
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      background: var(--ion-background-color);
      border-radius: 8px;
      margin: 6px 0;
      border-left: 3px solid var(--ion-color-primary);

      pre {
        margin: 6px 0 0 0;
        white-space: pre-wrap;
        color: var(--ion-color-medium);
      }
    }

    .queryList {
      padding: 0 20px;
    }

    .queryListTitle {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--ion-color-dark);
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        width: 4px;
        height: 24px;
        background: var(--ion-color-primary);
        border-radius: 2px;
      }
    }

    .queryCard {
      margin-bottom: 16px;
      border: 2px solid var(--ion-color-light);
      padding: 16px;
      border-radius: 12px;
      background: var(--ion-background-color);
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      &:hover {
        border-color: var(--ion-color-primary-tint);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
    }

    .queryContent {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .queryActions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .queryText {
      flex: 1;
      margin: 0;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--ion-color-light);
      padding: 12px;
      border-radius: 8px;
      line-height: 1.6;
    }

    .queryResult {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid var(--ion-color-light);
      animation: fadeIn 0.3s ease-in;

      strong {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        color: var(--ion-color-success);
        font-weight: 600;
        font-size: 14px;

        ion-icon {
          font-size: 18px;
        }
      }

      pre {
        margin: 0;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-word;
        background: var(--ion-color-light);
        padding: 12px;
        border-radius: 8px;
        line-height: 1.5;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .queryError {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid var(--ion-color-danger-tint);
      animation: fadeIn 0.3s ease-in;

      strong {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        color: var(--ion-color-danger);
        font-weight: 600;
        font-size: 14px;

        ion-icon {
          font-size: 18px;
        }
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--ion-color-danger-shade);
        background: rgba(var(--ion-color-danger-rgb), 0.1);
        padding: 14px;
        border-radius: 8px;
        border-left: 4px solid var(--ion-color-danger);
        line-height: 1.5;
      }
    }

    .historyItem {
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        --background-hover: var(--ion-color-light);
      }

      ion-label {
        h3 {
          font-weight: 500;
          margin-bottom: 6px;
          white-space: normal;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }
    }

    .emptyState {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      color: var(--ion-color-medium);

      p {
        margin: 0 0 16px 0;
        font-size: 14px;
      }
    }

    .tip {
      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }

    ion-header.pageHeader {
      max-width: 900px;
      margin: 0 auto;
    }

    ion-menu {
      ion-toolbar {
        ion-title {
          display: flex;
          align-items: center;
          gap: 8px;

          ion-icon {
            font-size: 20px;
          }
        }
      }
    }

    ion-menu-button {
      margin-top: 4px;
      margin-left: 3px;
    }

    .timestamp {
      font-size: 12px;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      gap: 4px;

      &::before {
        content: '';
        width: 4px;
        height: 4px;
        background: var(--ion-color-medium);
        border-radius: 50%;
      }
    }

    .resultList {
      margin-top: 12px;
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    .documentItem {
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--ion-color-light);

      &:hover {
        --background-hover: var(--ion-color-primary-tint);
        --background-hover-opacity: 0.1;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .dateLabel {
      flex: 0 0 auto;
      text-align: right;
      margin-right: 8px;

      p {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0;
        white-space: nowrap;
      }
    }

    .copyButton {
      --padding-start: 8px;
      --padding-end: 8px;
      height: 32px;
      transition: all 0.2s ease;

      &.copied {
        --background: var(--ion-color-success);
        --color: white;
      }
    }

    .helperText {
      font-size: 13px;
      color: var(--ion-color-medium);
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 4px;

      ion-icon {
        font-size: 16px;
        flex-shrink: 0;
      }
    }

    .suggestionCard {
      margin: 0 20px 20px 20px;
      padding: 20px;
      background: linear-gradient(135deg, rgba(var(--ion-color-warning-rgb), 0.1), rgba(var(--ion-color-warning-rgb), 0.05));
      border: 2px solid var(--ion-color-warning-tint);
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(var(--ion-color-warning-rgb), 0.15);
      animation: slideIn 0.4s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .suggestionHeader {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
      font-weight: 600;
      font-size: 16px;
      color: var(--ion-color-warning-shade);

      ion-icon {
        font-size: 24px;
        color: var(--ion-color-warning);
      }
    }

    .suggestionContent {
      font-size: 12px;
      line-height: 1.6;
      color: var(--ion-color-dark);
      background: rgba(255, 255, 255, 0.7);
      padding: 16px;
      border-radius: 12px;
    }
  `,
})
export class PromptPage implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService)
  private readonly router = inject(Router)
  private readonly storageService = inject(StorageService)
  private readonly platformId = inject(PLATFORM_ID)
  private eventSource: EventSource | null = null

  tips = signal([
    'Show me all users created this month',
    'Find top rating users',
  ])

  prompt = signal('')
  loading = signal(false)
  updates = signal<PromptUpdate[]>([])
  result = signal<{ queries: QueryItem[]; result: string; id: string } | null>(
    null
  )
  error = signal<string | null>(null)
  history = signal<PromptLog[]>([])
  showProgressDetails = signal(false)
  copiedQueryId = signal<string | null>(null)
  loadingHistory = signal(false)
  menuPinned = signal(false)

  whenCondition = computed(() => (this.menuPinned() ? `lg` : false))

  currentStep = computed(() => {
    const allUpdates = this.updates()
    if (allUpdates.length === 0) return ''
    const latest = allUpdates[allUpdates.length - 1]
    return latest.step
  })

  constructor() {
    addIcons({
      bulb,
      chevronDown,
      chevronUp,
      clipboard,
      checkmarkCircle,
      closeCircle,
      timeOutline,
      pin,
      pinOutline,
      menuOutline,
    })
  }

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return
    }

    const savedPinState = this.storageService.get<boolean>('menuPinned')
    if (savedPinState !== null) {
      this.menuPinned.set(savedPinState)
    }
    await this.loadPromptHistory()
  }

  ngOnDestroy(): void {
    this.closeEventSource()
  }

  async loadPromptHistory(): Promise<void> {
    this.loadingHistory.set(true)
    try {
      const response = await this.apiService.getPromptLogs({
        skip: 0,
        limit: 50,
      })
      this.history.set(response.data)
    } catch (error) {
      console.error('Failed to load prompt history:', error)
    } finally {
      this.loadingHistory.set(false)
    }
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
      const result = JSON.parse(event.data) as {
        id: string
        queries: string[]
        result: string
      }

      console.log(result)
      this.result.set({
        id: result.id,
        result: result.result,
        queries: result.queries.map((x) => ({
          id: crypto.randomUUID(),
          promptLogId: result.id,
          query: x,
          result: '',
          resultData: null,
          collection: this.extractCollectionFromQuery(x),
          isLoading: false,
          error: null,
        })),
      })
      this.loading.set(false)

      // Reload history to include the new prompt log
      this.loadPromptHistory()

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

  loadFromHistory(item: PromptLog, menu?: any): void {
    this.prompt.set(item.prompt)
    this.updates.set([])
    this.error.set(null)

    console.log(item)

    // Load the queries from the selected prompt log
    this.result.set({
      id: item._id,
      result: item.result,
      queries: item.queries.map((query) => ({
        id: crypto.randomUUID(),
        promptLogId: item._id,
        query: query,
        result: '',
        resultData: null,
        collection: this.extractCollectionFromQuery(query),
        isLoading: false,
        error: null,
      })),
    })

    // Close menu if not pinned
    if (!this.menuPinned() && menu) {
      menu.close()
    }
  }

  toggleProgressDetails(): void {
    this.showProgressDetails.update((show) => !show)
  }

  async runQuery(queryItem: QueryItem) {
    this.result.update((r) => {
      const item = r?.queries?.find((x) => x.id === queryItem.id)
      if (item) {
        item.isLoading = true
        item.error = null
      }

      return r ? { ...r } : null
    })

    try {
      const res = await this.apiService.runQueries(
        [queryItem.query],
        queryItem.promptLogId
      )

      this.result.update((r) => {
        const item = r?.queries?.find((x) => x.id === queryItem.id)
        if (item) {
          item.result = JSON.stringify(res[0], null, 2)
          item.resultData = res[0]
          item.isLoading = false
        }

        return r ? { ...r } : null
      })
    } catch (error) {
      this.result.update((r) => {
        const item = r?.queries?.find((x) => x.id === queryItem.id)
        if (item) {
          item.error =
            error instanceof Error ? error.message : 'Failed to run query'
          item.isLoading = false
        }

        return r ? { ...r } : null
      })
    }
  }

  isArrayWithIds(queryItem: QueryItem): boolean {
    const data = queryItem.resultData
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) => typeof item === 'object' && item !== null && '_id' in item
      )
    )
  }

  getResultDocuments(queryItem: QueryItem): DocumentData[] {
    if (!this.isArrayWithIds(queryItem)) {
      return []
    }
    return queryItem.resultData.map((x: any) => EJSON.deserialize(x))
  }

  viewDocument(documentId: ObjectId | string, collection: string | null): void {
    const id =
      typeof documentId === 'object' ? documentId.toHexString() : documentId

    if (collection) {
      this.router.navigate(['/document', collection, id])
    }
  }

  getDocumentName(doc: DocumentData): string {
    return (doc as any).name || ''
  }

  getDocumentEmail(doc: DocumentData): string {
    return (doc as any).email || ''
  }

  getDocumentUpdateDate(doc: DocumentData): string {
    const updatedAt = (doc as any).updatedAt || (doc as any).updated_at
    if (!updatedAt) return ''

    const date = new Date(updatedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  private extractCollectionFromQuery(query: string): string | null {
    const match = query.match(/db\.(\w+)\./)
    return match ? match[1] : null
  }

  async copyQueryToClipboard(queryItem: QueryItem): Promise<void> {
    try {
      await navigator.clipboard.writeText(queryItem.query)
      this.copiedQueryId.set(queryItem.id)
      setTimeout(() => {
        this.copiedQueryId.set(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  toggleMenuPin(): void {
    this.menuPinned.update((pinned) => {
      const newState = !pinned
      this.storageService.set('menuPinned', newState)
      return newState
    })
  }
}
