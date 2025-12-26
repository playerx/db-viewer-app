import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import {
  NuMonacoEditorComponent,
  NuMonacoEditorDiffComponent,
  NuMonacoEditorDiffModel,
  NuMonacoEditorEvent,
} from '@ng-util/monaco-editor'
import { addIcons } from 'ionicons'
import { checkmarkCircle } from 'ionicons/icons'
import { ApiService } from '../services/api.service'
import { DocumentData } from '../services/api.types'

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
    IonFab,
    IonFabButton,
    IonIcon,
    IonSpinner,
    IonTextarea,
    FormsModule,
    NuMonacoEditorComponent,
    NuMonacoEditorDiffComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documentDetail.page.html',
  styles: `
    .detailContainer {
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

    .monacoEditorContainer {
      flex: 1;
      min-height: 400px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .readOnlyField {
      background: var(--ion-color-light);
      padding: 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }

    .promptSection {
      border-top: 1px solid #e0e0e0;
      background: var(--ion-color-light);
      padding: 16px;
    }

    .promptInputContainer {
      display: flex;
      gap: 12px;
      align-items: flex-start;

      ion-textarea {
        flex: 1;
        --background: white;
        --border-radius: 8px;
        --padding-start: 12px;
        --padding-end: 12px;
        --padding-top: 8px;
        --padding-bottom: 8px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }

      ion-button {
        margin-top: 0;
        --padding-start: 24px;
        --padding-end: 24px;
      }
    }

    .diffActions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 12px;
      align-self: stretch;
    }

    .promptActions {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .runButton {
        flex: 1;
      }
    }
  `,
})
export class DocumentDetailPage implements OnInit {
  private readonly apiService = inject(ApiService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)

  promptInputEl = viewChild<IonTextarea>('promptInputEl')

  editor = viewChild<monaco.editor.IStandaloneCodeEditor>('editor')

  diffEditorKey = signal(0)

  collection = signal<string>('')
  documentId = signal<string>('')
  document = signal<DocumentData | null>(null)
  loading = signal(false)
  error = signal<string | null>(null)
  jsonString = signal('')
  saveSuccess = signal(false)

  // Prompt and diff-related signals
  promptText = signal('')
  showDiff = signal(false)
  modifiedJsonString = signal('')
  promptExpanded = signal(false)

  diffOldModel = computed<NuMonacoEditorDiffModel>(() => ({
    code: this.jsonString(),
    language: 'json',
  }))

  diffNewModel = computed<NuMonacoEditorDiffModel>(() => ({
    code: this.modifiedJsonString(),
    language: 'json',
  }))

  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: 'vs-light',
    language: 'json',
    minimap: { enabled: false },
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    fontSize: 14,
    tabSize: 2,
    lineNumbers: 'off',
  }

  diffEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: 'vs-light',
    minimap: { enabled: false },
    automaticLayout: true,
    readOnly: false,
    fontSize: 14,
    tabSize: 2,
    lineNumbers: 'off',
  }

  diffEditor = viewChild(NuMonacoEditorDiffComponent)

  ngOnInit(): void {
    const collection = this.route.snapshot.paramMap.get('collection')
    const id = this.route.snapshot.paramMap.get('id')

    if (collection && id) {
      this.collection.set(collection)
      this.documentId.set(id)
      this.loadDocument()
    }

    addIcons({
      checkmarkCircle,
    })
  }

  onEditorInit(e: NuMonacoEditorEvent) {
    if (e.type === 'init') {
      e.editor?.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
        this.saveDocument()
      )
    }

    if (e.type === 'update-diff') {
      this.modifiedJsonString.set(e.diffValue!)
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
      // Convert BSON types to Extended JSON format for editing
      const jsonStr = JSON.stringify(doc, null, 2)

      this.jsonString.set(jsonStr)
      this.modifiedJsonString.set(jsonStr)
      this.loading.set(false)
    } catch (err) {
      this.error.set('Failed to load document')
      this.loading.set(false)
      console.error(err)
    }
  }

  async saveDocument(): Promise<void> {
    let dataToSave: unknown

    try {
      // Convert Extended JSON to BSON types for MongoDB
      dataToSave = this.modifiedJsonString()
    } catch (err) {
      alert('Invalid JSON format')
      return
    }

    this.loading.set(true)
    try {
      const updatedDoc = await this.apiService.updateDocument(
        this.collection(),
        this.documentId(),
        dataToSave as Record<string, unknown>
      )
      this.document.set(updatedDoc)
      // Convert BSON types back to Extended JSON format for editing
      const jsonStr = JSON.stringify(updatedDoc, null, 2)

      this.jsonString.set(jsonStr)
      this.loading.set(false)

      this.promptText.set('')
      this.diffEditorKey.update((x) => x + 1)

      this.showDiff.set(false)

      // Show success feedback
      this.saveSuccess.set(true)
      setTimeout(() => this.saveSuccess.set(false), 500)
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

  async runPrompt(): Promise<void> {
    // TODO: Replace with actual API call when ready
    // For now, we'll use mock data to demonstrate the diff functionality
    this.loading.set(true)

    try {
      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 1000))

      const res = await this.apiService.jsonTransform(
        this.modifiedJsonString(),
        this.promptText()
      )

      // Generate mock modified JSON based on the current document
      // const currentData = JSON.parse(this.modifiedJsonString())
      // const mockModified = this.generateMockModification(
      //   currentData,
      //   this.promptText()
      // )

      this.modifiedJsonString.set(JSON.stringify(res.data, null, 2))

      this.diffEditorKey.update((v) => v + 1)

      this.showDiff.set(true)
      this.loading.set(false)
    } catch (err) {
      this.loading.set(false)
      console.error(err)
      alert('Failed to process prompt')
    }
  }

  generateMockModification(
    data: Record<string, unknown>,
    prompt: string
  ): Record<string, unknown> {
    // Create a copy of the data
    const modified = JSON.parse(JSON.stringify(data))

    // Apply some mock transformations based on common prompts
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes('add') || lowerPrompt.includes('new')) {
      // Add a new field
      modified['aiGeneratedField'] = 'This is a new field added by AI'
      modified['timestamp'] = new Date().toISOString()
    }

    if (lowerPrompt.includes('update') || lowerPrompt.includes('modify')) {
      // Modify existing fields
      Object.keys(modified).forEach((key) => {
        if (typeof modified[key] === 'string') {
          modified[key] = `${modified[key]} (updated)`
        }
      })
    }

    if (lowerPrompt.includes('remove') || lowerPrompt.includes('delete')) {
      // Remove the first non-_id field
      const keys = Object.keys(modified).filter((k) => k !== '_id')
      if (keys.length > 0) {
        delete modified[keys[0]]
      }
    }

    if (lowerPrompt.includes('status')) {
      modified['status'] = 'active'
      modified['updatedAt'] = new Date().toISOString()
    }

    // Default: add some metadata
    if (
      !lowerPrompt.includes('add') &&
      !lowerPrompt.includes('update') &&
      !lowerPrompt.includes('remove')
    ) {
      modified['metadata'] = {
        processedBy: 'AI Assistant',
        prompt: prompt,
        timestamp: new Date().toISOString(),
      }
    }

    return modified
  }

  cancelDiff(): void {
    this.showDiff.set(false)
    this.modifiedJsonString.set(this.jsonString())
    this.promptText.set('')
    this.promptExpanded.set(false)

    this.diffEditorKey.update((v) => v + 1)
  }

  togglePrompt(): void {
    this.promptExpanded.update((v) => !v)
    setTimeout(() => this.promptInputEl()?.setFocus(), 100)
  }

  acceptChanges(): void {
    // Apply the modified JSON to the main editor
    this.jsonString.set(this.modifiedJsonString())
    this.showDiff.set(false)
    this.modifiedJsonString.set('')
    this.promptText.set('')
  }
}
