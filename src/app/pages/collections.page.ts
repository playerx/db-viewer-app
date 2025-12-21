import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core'
import { Router } from '@angular/router'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chevronForward, menu } from 'ionicons/icons'
import { DocumentData, PaginationInfo } from '../models/api.types'
import { ApiService } from '../services/api.service'

@Component({
  selector: 'app-collections',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonSplitPane,
    IonMenu,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonMenuButton,
    IonNote,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collections.page.html',
  styles: `
    .loadingContainer {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .emptyState {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }

    .documentItem {
      cursor: pointer;
    }

    .documentPreview {
      font-family: monospace;
      font-size: 12px;
      color: var(--ion-color-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .selectedCollection {
      --background: var(--ion-color-light);
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
  `,
})
export class CollectionsPage implements OnInit {
  private readonly apiService = inject(ApiService)
  private readonly router = inject(Router)

  collections = signal<string[]>([])
  searchQuery = signal('')
  loading = signal(false)
  error = signal<string | null>(null)

  selectedCollection = signal<string | null>(null)
  documents = signal<DocumentData[]>([])
  pagination = signal<PaginationInfo | null>(null)
  documentsLoading = signal(false)
  documentsError = signal<string | null>(null)

  filteredCollections = computed(() => {
    const query = this.searchQuery().toLowerCase()
    if (!query) return this.collections()
    return this.collections().filter((c) => c.toLowerCase().includes(query))
  })

  constructor() {
    addIcons({ chevronForward, menu })
  }

  ngOnInit(): void {
    this.loadCollections()
  }

  async loadCollections(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const collections = await this.apiService.getCollections()
      this.collections.set(collections)
      this.loading.set(false)

      // Auto-select first collection if available
      if (collections.length > 0 && !this.selectedCollection()) {
        this.selectCollection(collections[0])
      }
    } catch (err) {
      this.error.set('Failed to load collections')
      this.loading.set(false)
      console.error(err)
    }
  }

  async selectCollection(collection: string): Promise<void> {
    this.selectedCollection.set(collection)
    this.documents.set([])
    this.loadDocuments(collection)
  }

  async loadDocuments(collection: string, skip = 0): Promise<void> {
    this.documentsLoading.set(true)
    this.documentsError.set(null)
    try {
      const response = await this.apiService.getDocuments(collection, {
        skip,
        limit: 20,
      })
      if (skip === 0) {
        this.documents.set(response.data)
      } else {
        this.documents.update((docs) => [...docs, ...response.data])
      }
      this.pagination.set(response.pagination)
      this.documentsLoading.set(false)
    } catch (err) {
      this.documentsError.set('Failed to load documents')
      this.documentsLoading.set(false)
      console.error(err)
    }
  }

  async loadMore(event: Event): Promise<void> {
    const pagination = this.pagination()
    const collection = this.selectedCollection()
    if (pagination && pagination.hasMore && collection) {
      const nextSkip = pagination.skip + pagination.limit
      try {
        const response = await this.apiService.getDocuments(collection, {
          skip: nextSkip,
          limit: 20,
        })
        this.documents.update((docs) => [...docs, ...response.data])
        this.pagination.set(response.pagination)
        ;(event.target as HTMLIonInfiniteScrollElement).complete()
      } catch {
        ;(event.target as HTMLIonInfiniteScrollElement).complete()
      }
    } else {
      ;(event.target as HTMLIonInfiniteScrollElement).complete()
    }
  }

  viewDocument(documentId: string): void {
    const collection = this.selectedCollection()
    if (collection) {
      this.router.navigate(['/document', collection, documentId])
    }
  }

  handleRefresh(event: Event): void {
    this.loadCollections()
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
  }

  handleDocumentsRefresh(event: Event): void {
    const collection = this.selectedCollection()
    if (collection) {
      this.loadDocuments(collection)
    }
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
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
}
