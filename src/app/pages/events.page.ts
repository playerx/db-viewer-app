import { DatePipe, JsonPipe } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { ApiService } from '../services/api.service'
import { EventLog, EventsResponse } from '../services/api.types'

@Component({
  selector: 'app-events',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonToggle,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    DatePipe,
    JsonPipe,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './events.page.html',
  styles: `
    .eventsContainer {
      padding: 16px;
    }

    .filterBar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .eventCard {
      margin-bottom: 12px;
    }

    .debugSteps {
      margin-top: 12px;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
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

    .metaInfo {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }
  `,
})
export class EventsPage implements OnInit {
  private readonly api = inject(ApiService)

  events = signal<EventLog[]>([])
  loading = signal(false)
  error = signal<string | null>(null)
  showDebug = signal(false)
  selectedType = signal<string>('all')

  eventTypes = ['all', 'UPDATE', 'DELETE', 'PROMPT']

  filteredEvents = computed(() => {
    const type = this.selectedType()
    if (type === 'all') return this.events()
    return this.events().filter((e) => e.type === type)
  })

  ngOnInit(): void {
    this.loadEvents()
  }

  async loadEvents(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)
    const params = this.showDebug() ? { debug: true } : undefined
    try {
      const response = await this.api.getEvents(params)
      if (Array.isArray(response)) {
        this.events.set(response)
      } else {
        this.events.set((response as EventsResponse).events)
      }
      this.loading.set(false)
    } catch (err) {
      this.error.set('Failed to load events')
      this.loading.set(false)
      console.error(err)
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.api.deleteEvent(eventId)
      this.events.update((events) => events.filter((e) => e._id !== eventId))
    } catch (err) {
      console.error('Failed to delete event', err)
      alert('Failed to delete event')
    }
  }

  handleRefresh(event: Event): void {
    this.loadEvents()
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
  }

  toggleDebug(): void {
    this.showDebug.update((show) => !show)
    this.loadEvents()
  }

  selectType(type: string): void {
    this.selectedType.set(type)
  }

  getEventColor(type: string): string {
    switch (type) {
      case 'UPDATE':
        return 'primary'
      case 'DELETE':
        return 'danger'
      case 'PROMPT':
        return 'tertiary'
      default:
        return 'medium'
    }
  }

  getEventCardClass(type: string): string {
    switch (type) {
      case 'UPDATE':
        return 'eventTypeUpdate'
      case 'DELETE':
        return 'eventTypeDelete'
      case 'PROMPT':
        return 'eventTypePrompt'
      default:
        return ''
    }
  }
}
