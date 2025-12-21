import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { DocumentData } from '../models/api.types'
import { ApiService } from '../services/api.service'

@Component({
  selector: 'app-document-detail',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonTextarea,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documentDetail.page.html',
  styles: `
    .detailContainer {
      padding: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .loadingContainer {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .errorContainer {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-danger);
    }

    .jsonEditor {
      font-family: monospace;
      font-size: 14px;
      flex: 1;
      border: 1px solid #e0e0e0;
    }

    .actionButtons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      justify-content: flex-end;
    }

    .readOnlyField {
      background: var(--ion-color-light);
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
  `,
})
export class DocumentDetailPage implements OnInit {
  private readonly apiService = inject(ApiService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  collection = signal<string>('')
  documentId = signal<string>('')
  document = signal<DocumentData | null>(null)
  loading = signal(false)
  error = signal<string | null>(null)
  jsonString = signal('')
  originalJsonString = signal('')

  hasChanges = computed(() => {
    return this.jsonString() !== this.originalJsonString()
  })

  ngOnInit(): void {
    const collection = this.route.snapshot.paramMap.get('collection')
    const id = this.route.snapshot.paramMap.get('id')

    if (collection && id) {
      this.collection.set(collection)
      this.documentId.set(id)
      this.loadDocument()
    }
  }

  async loadDocument(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    try {
      const doc = await this.apiService.getDocumentById(
        this.collection(),
        this.documentId()
      )
      this.document.set(doc)
      const jsonStr = JSON.stringify(doc, null, 2)
      this.jsonString.set(jsonStr)
      this.originalJsonString.set(jsonStr)
      this.loading.set(false)
    } catch (err) {
      this.error.set('Failed to load document')
      this.loading.set(false)
      console.error(err)
    }
  }

  async saveDocument(): Promise<void> {
    let dataToSave: Record<string, unknown>

    try {
      dataToSave = JSON.parse(this.jsonString())
    } catch (err) {
      alert('Invalid JSON format')
      return
    }

    this.loading.set(true)
    try {
      const updatedDoc = await this.apiService.updateDocument(
        this.collection(),
        this.documentId(),
        dataToSave
      )
      this.document.set(updatedDoc)
      const jsonStr = JSON.stringify(updatedDoc, null, 2)
      this.jsonString.set(jsonStr)
      this.originalJsonString.set(jsonStr)
      this.loading.set(false)
      alert('Document updated successfully')
    } catch (err) {
      this.loading.set(false)
      console.error(err)
      alert('Failed to update document')
    }
  }

  async deleteDocument(): Promise<void> {
    if (
      !confirm(
        'Are you sure you want to delete this document? This action cannot be undone.'
      )
    ) {
      return
    }

    this.loading.set(true)
    try {
      await this.apiService.deleteDocument(this.collection(), this.documentId())
      alert('Document deleted successfully')
      this.router.navigate(['/tabs/data'])
    } catch (err) {
      this.loading.set(false)
      console.error(err)
      alert('Failed to delete document')
    }
  }
}
