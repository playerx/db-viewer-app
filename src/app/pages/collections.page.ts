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
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonInput,
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
import { add, chevronForward, close, filterOutline, menu } from 'ionicons/icons'
import { DocumentData, FilterItem, PaginationInfo } from '../models/api.types'
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
    IonButtons,
    IonSplitPane,
    IonMenu,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonMenuButton,
    IonNote,
    IonInput,
    IonChip,
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

    .filtersContainer {
      padding: 16px;
      border-bottom: 1px solid var(--ion-color-light);
      background: var(--ion-color-light-tint);
    }

    .filterInputs {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      margin-bottom: 12px;

      .fieldInputWrapper {
        flex: 1;
        position: relative;
      }

      .filterInput {
        flex: 1;
        --background: var(--ion-color-white, #fff);
      }

      .addFilterButton {
        flex-shrink: 0;
        height: 40px;
        margin: 0;
      }
    }

    .autocompleteDropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--ion-color-white, #fff);
      border: 1px solid var(--ion-color-light);
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      margin-top: 4px;

      .autocompleteItem {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--ion-color-light-shade);

        &:hover {
          background: var(--ion-color-light);
        }

        &:last-child {
          border-bottom: none;
        }
      }
    }

    .activeFilters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .filterChip {
        cursor: pointer;

        ion-icon {
          cursor: pointer;
          margin-left: 4px;
        }
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

  filters = signal<FilterItem[]>([])
  newFilterField = signal('')
  newFilterValue = signal('')
  showFilters = signal(false)
  showFieldAutocomplete = signal(false)

  filteredCollections = computed(() => {
    const query = this.searchQuery().toLowerCase()
    if (!query) return this.collections()
    return this.collections().filter((c) => c.toLowerCase().includes(query))
  })

  availableFields = computed(() => {
    const docs = this.documents()
    if (docs.length === 0) return []

    const fieldSet = new Set<string>()
    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => fieldSet.add(key))
    })

    return Array.from(fieldSet).sort()
  })

  filteredFields = computed(() => {
    const query = this.newFilterField().toLowerCase()
    const fields = this.availableFields()
    if (!query) return fields
    return fields.filter((f) => f.toLowerCase().includes(query))
  })

  constructor() {
    addIcons({
      chevronForward,
      menu,
      close,
      add,
      filterOutline,
    })
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show)
  }

  selectField(field: string): void {
    this.newFilterField.set(field)
    this.showFieldAutocomplete.set(false)
  }

  onFieldFocus(): void {
    if (this.availableFields().length > 0) {
      this.showFieldAutocomplete.set(true)
    }
  }

  onFieldBlur(): void {
    // Delay to allow click on suggestion
    setTimeout(() => {
      this.showFieldAutocomplete.set(false)
    }, 200)
  }

  addFilter(): void {
    const field = this.newFilterField().trim()
    const value = this.newFilterValue().trim()

    if (field && value) {
      this.filters.update((filters) => [...filters, { field, value }])
      this.newFilterField.set('')
      this.newFilterValue.set('')
      this.reloadDocumentsWithFilters()
    }
  }

  removeFilter(index: number): void {
    this.filters.update((filters) => filters.filter((_, i) => i !== index))
    this.reloadDocumentsWithFilters()
  }

  private reloadDocumentsWithFilters(): void {
    const collection = this.selectedCollection()
    if (collection) {
      this.documents.set([])
      this.loadDocuments(collection)
    }
  }

  private buildFilterParams(): Record<string, string> {
    const params: Record<string, string> = {}
    this.filters().forEach((filter) => {
      params[filter.field] = filter.value
    })
    return params
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
    this.filters.set([])
    this.loadDocuments(collection)
  }

  async loadDocuments(collection: string, skip = 0): Promise<void> {
    this.documentsLoading.set(true)
    this.documentsError.set(null)
    try {
      const filterParams = this.buildFilterParams()
      const response = await this.apiService.getDocuments(collection, {
        skip,
        limit: 20,
        ...filterParams,
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
        const filterParams = this.buildFilterParams()
        const response = await this.apiService.getDocuments(collection, {
          skip: nextSkip,
          limit: 20,
          ...filterParams,
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
