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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { chevronForward } from 'ionicons/icons'
import { ApiService } from '../services/api.service'

@Component({
  selector: 'app-collection',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection.page.html',
  styles: `
    .collectionCard {
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }
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

    .cardContent {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class CollectionPage implements OnInit {
  private readonly apiService = inject(ApiService)
  private readonly router = inject(Router)

  collections = signal<string[]>([])
  searchQuery = signal('')
  loading = signal(false)
  error = signal<string | null>(null)

  filteredCollections = computed(() => {
    const query = this.searchQuery().toLowerCase()
    if (!query) return this.collections()
    return this.collections().filter((c) => c.toLowerCase().includes(query))
  })

  constructor() {
    addIcons({ chevronForward })
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
    this.router.navigate(['/data', collection])
  }

  handleRefresh(event: Event): void {
    this.loadCollections()
    setTimeout(() => {
      ;(event.target as HTMLIonRefresherElement).complete()
    }, 1000)
  }
}
