import { isPlatformBrowser } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core'
import { Router } from '@angular/router'
import {
  AlertController,
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
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { EJSON, ObjectId } from 'bson'
import { addIcons } from 'ionicons'
import {
  add,
  chevronForward,
  close,
  filterOutline,
  menu,
  trash,
} from 'ionicons/icons'
import { ApiService } from '../services/api.service'
import { DocumentData, FilterItem, PaginationInfo } from '../services/api.types'
import { DataService } from '../services/data.service'
import { MenuService } from '../services/menu.service'
import { TenantService } from '../services/tenant.service'

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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
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
    IonSelect,
    IonSelectOption,
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


    ion-menu-button {
      margin-top: 0px;
      margin-left: 4px;
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

      .operatorInput {
        flex: 0.8;
        min-width: 140px;
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
export class CollectionsPage implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService)
  private readonly router = inject(Router)
  private readonly tenantService = inject(TenantService)
  private readonly alertController = inject(AlertController)
  private readonly dataService = inject(DataService)
  private readonly platformId = inject(PLATFORM_ID)
  readonly menuService = inject(MenuService)
  private unsubscribeTenantChange?: () => void

  collections = signal<string[]>([])
  searchQuery = signal('')
  loading = signal(false)
  error = signal<string | null>(null)

  selectedCollection = signal<string | null>(null)
  initialDocuments = signal<DocumentData[]>([])
  documents = signal<DocumentData[]>([])
  pagination = signal<PaginationInfo | null>(null)
  documentsLoading = signal(false)
  documentsError = signal<string | null>(null)

  filters = signal<FilterItem[]>([])
  newFilterField = signal('')
  newFilterOperator = signal('eq')
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
    const types: Record<string, string> = {}

    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        fieldSet.add(key)
        // Detect type from first non-null value
        if (!types[key] && doc[key] !== null && doc[key] !== undefined) {
          const value = doc[key]
          if (typeof value === 'number') {
            types[key] = 'number'
          } else if (typeof value === 'boolean') {
            types[key] = 'boolean'
          } else if (
            value instanceof Date ||
            (typeof value === 'string' &&
              !isNaN(Date.parse(value)) &&
              /^\d{4}-\d{2}-\d{2}/.test(value))
          ) {
            types[key] = 'date'
          } else {
            types[key] = 'string'
          }
        }
      })
    })

    // this.fieldTypes.set(types)
    const res = Array.from(fieldSet).sort()

    return res
  })

  fieldTypes = computed<Record<string, string>>(() => {
    const docs = this.initialDocuments()
    if (docs.length === 0) return {}

    const fieldSet = new Set<string>()
    const types: Record<string, string> = {}

    docs.forEach((doc) => {
      Object.keys(doc).forEach((key) => {
        fieldSet.add(key)
        // Detect type from first non-null value
        if (!types[key] && doc[key] !== null && doc[key] !== undefined) {
          const value = doc[key]
          if (typeof value === 'number') {
            types[key] = 'number'
          } else if (typeof value === 'boolean') {
            types[key] = 'boolean'
          } else if (
            value instanceof Date ||
            (typeof value === 'string' &&
              !isNaN(Date.parse(value)) &&
              /^\d{4}-\d{2}-\d{2}/.test(value))
          ) {
            types[key] = 'date'
          } else {
            types[key] = 'string'
          }
        }
      })
    })

    return types
  })

  filteredFields = computed(() => {
    const query = this.newFilterField().toLowerCase()
    const fields = this.availableFields()
    if (!query) return fields
    return fields.filter((f) => f.toLowerCase().includes(query))
  })

  currentFieldType = computed(() => {
    const field = this.newFilterField()
    return this.fieldTypes()[field] || 'string'
  })

  availableOperators = computed(() => {
    const fieldType = this.currentFieldType()
    if (fieldType === 'number' || fieldType === 'date') {
      return [
        { value: 'eq', label: 'equals (=)' },
        { value: 'ne', label: 'not equals (≠)' },
        { value: 'gt', label: 'greater than (>)' },
        { value: 'ge', label: 'greater or equal (≥)' },
        { value: 'lt', label: 'less than (<)' },
        { value: 'le', label: 'less or equal (≤)' },
      ]
    } else if (fieldType === 'boolean') {
      return [
        { value: 'eq', label: 'equals (=)' },
        { value: 'ne', label: 'not equals (≠)' },
      ]
    } else {
      return [
        { value: 'eq', label: 'equals (=)' },
        { value: 'ne', label: 'not equals (≠)' },
        { value: 'contains', label: 'contains' },
        { value: 'startswith', label: 'starts with' },
        { value: 'endswith', label: 'ends with' },
      ]
    }
  })

  constructor() {
    addIcons({
      chevronForward,
      menu,
      close,
      add,
      filterOutline,
      trash,
    })

    // Listen for refresh trigger from other components
    effect(() => {
      const trigger = this.dataService.getRefreshTrigger()()
      if (trigger > 0) {
        const collection = this.selectedCollection()
        if (collection) {
          this.loadDocuments(collection)
        }
      }
    })
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show)
  }

  selectField(field: string): void {
    this.newFilterField.set(field)
    this.showFieldAutocomplete.set(false)
    // Reset operator to default when field changes
    this.newFilterOperator.set('eq')
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
    const operator = this.newFilterOperator()
    const value = this.newFilterValue().trim()

    if (field && value) {
      this.filters.update((filters) => [...filters, { field, operator, value }])
      this.newFilterField.set('')
      this.newFilterOperator.set('eq')
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
    const filters = this.filters()

    if (filters.length > 0) {
      // Build OData $filter query string
      const filterExpressions = filters.map((filter) => {
        const fieldType = this.fieldTypes()[filter.field] || 'string'
        let formattedValue: string | number

        // Format value based on field type
        if (fieldType === 'number') {
          // Numbers don't need quotes
          formattedValue = +filter.value
        } else if (fieldType === 'boolean') {
          // Booleans are lowercase true/false without quotes
          formattedValue = filter.value.toLowerCase()
        } else if (fieldType === 'date') {
          // Dates should be in ISO format without quotes (or with quotes depending on OData version)
          formattedValue = filter.value
        } else {
          // Strings need quotes and escaping
          const escapedValue = filter.value.replace(/'/g, "''")
          formattedValue = `'${escapedValue}'`
        }

        // Handle special string operators
        if (
          filter.operator === 'contains' ||
          filter.operator === 'startswith' ||
          filter.operator === 'endswith'
        ) {
          const escapedValue = filter.value.replace(/'/g, "''")
          return `${filter.operator}(${filter.field}, '${escapedValue}')`
        }

        // Standard comparison operators
        return `${filter.field} ${filter.operator} ${formattedValue}`
      })

      // Combine multiple filters with 'and' operator
      params['$filter'] = filterExpressions.join(' and ')
    }

    return params
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return
    }

    this.loadCollections()

    // Subscribe to tenant changes
    this.unsubscribeTenantChange = this.tenantService.onTenantChange(() => {
      // Reset state and reload collections when tenant changes
      this.collections.set([])
      this.selectedCollection.set(null)
      this.documents.set([])
      this.initialDocuments.set([])
      this.filters.set([])
      this.pagination.set(null)
      this.loadCollections()
    })
  }

  ngOnDestroy(): void {
    // Cleanup subscription
    if (this.unsubscribeTenantChange) {
      this.unsubscribeTenantChange()
    }
  }

  async loadCollections(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const collections = await this.apiService.getCollections()
      const sortedCollections = collections.sort((a, b) => a.localeCompare(b))
      this.collections.set(sortedCollections)
      this.loading.set(false)

      // Auto-select first collection if available
      if (sortedCollections.length > 0 && !this.selectedCollection()) {
        this.selectCollection(sortedCollections[0])
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
        $skip: skip,
        $top: 20,
        ...filterParams,
      })
      if (skip === 0) {
        this.documents.set(response.data.map((x) => EJSON.deserialize(x)))

        if (!this.initialDocuments().length) {
          this.initialDocuments.set(response.data)
        }
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
          $skip: nextSkip,
          $top: 20,
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

  viewDocument(documentId: ObjectId | string): void {
    const id =
      typeof documentId === 'object' ? documentId.toHexString() : documentId

    const collection = this.selectedCollection()
    if (collection) {
      this.router.navigate(['/document', collection, id])
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

  async deleteDocument(
    doc: DocumentData,
    slidingItem: IonItemSliding
  ): Promise<void> {
    const collection = this.selectedCollection()
    if (!collection || !doc._id) return

    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message:
        'Are you sure you want to delete this record? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            slidingItem.close()
          },
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              const id =
                typeof doc._id === 'object'
                  ? doc._id.toHexString()
                  : String(doc._id)
              await this.apiService.deleteDocument(collection, id)

              // Remove document from the list
              this.documents.update((docs) =>
                docs.filter((d) => d._id !== doc._id)
              )

              // Update pagination count
              this.pagination.update((p) => {
                if (p) {
                  return {
                    ...p,
                    total: p.total - 1,
                  }
                }
                return p
              })

              slidingItem.close()
            } catch (err) {
              console.error('Failed to delete document:', err)
              slidingItem.close()
            }
          },
        },
      ],
    })

    await alert.present()
  }
}
