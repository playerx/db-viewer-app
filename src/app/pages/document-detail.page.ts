import { JsonPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
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
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    FormsModule,
    JsonPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-detail.page.html',
  styles: `
    .detailContainer {
      padding: 16px;
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
      min-height: 300px;
    }

    .fieldItem {
      margin-bottom: 12px;
    }

    .actionButtons {
      display: flex;
      gap: 8px;
      margin-top: 16px;
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
  editMode = signal(false)
  jsonEditMode = signal(false)
  jsonString = signal('')
  editedDocument = signal<DocumentData>({})

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
      const doc = await this.apiService.getDocumentById(this.collection(), this.documentId())
      this.document.set(doc)
      this.editedDocument.set({ ...doc })
      this.jsonString.set(JSON.stringify(doc, null, 2))
      this.loading.set(false)
    } catch (err) {
      this.error.set('Failed to load document')
      this.loading.set(false)
      console.error(err)
    }
  }

  toggleEditMode(): void {
    if (this.editMode()) {
      // Cancel edit
      this.editMode.set(false)
      this.jsonEditMode.set(false)
      this.editedDocument.set({ ...this.document()! })
      this.jsonString.set(JSON.stringify(this.document(), null, 2))
    } else {
      // Enter edit mode
      this.editMode.set(true)
    }
  }

  toggleJsonEditMode(): void {
    if (!this.jsonEditMode()) {
      this.jsonString.set(JSON.stringify(this.editedDocument(), null, 2))
    }
    this.jsonEditMode.update((mode) => !mode)
  }

  async saveDocument(): Promise<void> {
    let dataToSave: Record<string, unknown>

    if (this.jsonEditMode()) {
      try {
        dataToSave = JSON.parse(this.jsonString())
      } catch (err) {
        alert('Invalid JSON format')
        return
      }
    } else {
      dataToSave = { ...this.editedDocument() }
      // delete dataToSave._id // Don't send _id in update
    }

    this.loading.set(true)
    try {
      const updatedDoc = await this.apiService.updateDocument(this.collection(), this.documentId(), dataToSave)
      this.document.set(updatedDoc)
      this.editedDocument.set({ ...updatedDoc })
      this.jsonString.set(JSON.stringify(updatedDoc, null, 2))
      this.editMode.set(false)
      this.jsonEditMode.set(false)
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

  getDocumentKeys(): string[] {
    const doc = this.editedDocument()
    return Object.keys(doc).filter((key) => key !== '_id')
  }

  updateField(key: string, value: string): void {
    this.editedDocument.update((doc) => ({
      ...doc,
      [key]: this.parseValue(value),
    }))
  }

  private parseValue(value: string): unknown {
    // Try to parse as number
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') {
      return num
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false

    // Try to parse as JSON
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
}
