import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone'
import { Router } from '@angular/router'
import { ApiService } from '../services/api.service'
import { DocumentData, PaginationInfo } from '../models/api.types'
import { addIcons } from 'ionicons'
import { search, chevronForward } from 'ionicons/icons'

@Component({
  selector: 'app-data',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonSearchbar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data.page.html',
  styles: `
    .collectionCard {
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .documentItem {
      cursor: pointer;
    }

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

    .documentPreview {
      font-family: monospace;
      font-size: 12px;
      color: var(--ion-color-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class DataPage implements OnInit {
  private readonly apiService = inject(ApiService)
  private readonly router = inject(Router)

  collections = signal<string[]>([])
  selectedCollection = signal<string | null>(null)
  documents = signal<DocumentData[]>([])
  pagination = signal<PaginationInfo | null>(null)
  searchQuery = signal('')
  loading = signal(false)
  error = signal<string | null>(null)

  showDocuments = computed(() => this.selectedCollection() !== null)
  filteredCollections = computed(() => {
    const query = this.searchQuery().toLowerCase()
    if (!query) return this.collections()
    return this.collections().filter(c => c.toLowerCase().includes(query))
  })

  constructor() {
    addIcons({ search, chevronForward })
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
    } catch (err) {
      this.error.set('Failed to load collections')
      this.loading.set(false)
      console.error(err)
    }
  }

  selectCollection(collection: string): void {
    this.selectedCollection.set(collection)
    this.documents.set([])
    this.pagination.set(null)
    this.loadDocuments(collection)
  }

  async loadDocuments(collection: string, skip = 0): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const response = await this.apiService.getDocuments(collection, { skip, limit: 20 })
      if (skip === 0) {
        this.documents.set(response.data)
      } else {
        this.documents.update(docs => [...docs, ...response.data])
      }
      this.pagination.set(response.pagination)
      this.loading.set(false)
    } catch (err) {
      this.error.set('Failed to load documents')
      this.loading.set(false)
      console.error(err)
    }
  }

  async loadMore(event: Event): Promise<void> {
    const pagination = this.pagination()
    const collection = this.selectedCollection()
    if (pagination && pagination.hasMore && collection) {
      const nextSkip = pagination.skip + pagination.limit
      try {
        const response = await this.apiService.getDocuments(collection, { skip: nextSkip, limit: 20 })
        this.documents.update(docs => [...docs, ...response.data])
        this.pagination.set(response.pagination)
        ;(event.target as HTMLIonInfiniteScrollElement).complete()
      } catch {
        ;(event.target as HTMLIonInfiniteScrollElement).complete()
      }
    } else {
      ;(event.target as HTMLIonInfiniteScrollElement).complete()
    }
  }

  viewDocument(collection: string, documentId: string): void {
    this.router.navigate(['/document', collection, documentId])
  }

  handleRefresh(event: Event): void {
    const collection = this.selectedCollection()
    if (collection) {
      this.loadDocuments(collection)
    } else {
      this.loadCollections()
    }
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
  }

  backToCollections(): void {
    this.selectedCollection.set(null)
    this.documents.set([])
    this.pagination.set(null)
  }

  getDocumentPreview(doc: DocumentData): string {
    const { _id, ...rest } = doc
    return JSON.stringify(rest)
  }
}
