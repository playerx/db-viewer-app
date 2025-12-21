import {
  Component,
  ChangeDetectionStrategy,
  signal,
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
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonChip,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone'
import { Router, ActivatedRoute } from '@angular/router'
import { ApiService } from '../services/api.service'
import { DocumentData, PaginationInfo } from '../models/api.types'
import { addIcons } from 'ionicons'
import { chevronForward } from 'ionicons/icons'

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
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonBackButton,
    IonButtons,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data.page.html',
  styles: `
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
  private readonly route = inject(ActivatedRoute)

  collection = signal<string>('')
  documents = signal<DocumentData[]>([])
  pagination = signal<PaginationInfo | null>(null)
  loading = signal(false)
  error = signal<string | null>(null)

  constructor() {
    addIcons({ chevronForward })
  }

  ngOnInit(): void {
    const collectionName = this.route.snapshot.paramMap.get('collection')
    if (collectionName) {
      this.collection.set(collectionName)
      this.loadDocuments(collectionName)
    }
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
    const collectionName = this.collection()
    if (pagination && pagination.hasMore && collectionName) {
      const nextSkip = pagination.skip + pagination.limit
      try {
        const response = await this.apiService.getDocuments(collectionName, { skip: nextSkip, limit: 20 })
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

  viewDocument(documentId: string): void {
    const collectionName = this.collection()
    if (collectionName) {
      this.router.navigate(['/document', collectionName, documentId])
    }
  }

  handleRefresh(event: Event): void {
    const collectionName = this.collection()
    if (collectionName) {
      this.loadDocuments(collectionName)
    }
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
  }

  getDocumentPreview(doc: DocumentData): string {
    const { _id, ...rest } = doc
    return JSON.stringify(rest)
  }
}
