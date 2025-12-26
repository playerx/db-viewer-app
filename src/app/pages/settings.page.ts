import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  AlertController,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { TenantService } from '../services/tenant.service'

@Component({
  selector: 'app-settings',
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
    IonNote,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    FormsModule,
    IonCardSubtitle,
  ],
  templateUrl: './settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .loadingContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
    }

    .centeredContent {
      max-width: 800px;
      margin: 0 auto;
    }

    ion-note.hint {
      margin-bottom: 18px;
      display: block;
      margin-top: -18px;
    }

    .tenantItem {
      --inner-padding-end: 0;
    }

    .tenantContent {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .tenantActions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .tenantContent {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .tenantActions {
        width: 100%;
        justify-content: stretch;

        ion-button {
          flex: 1;
        }
      }

      ion-label {
        margin-bottom: 0.25rem;
      }
    }
  `,
})
export class SettingsPage {
  private readonly alertController = inject(AlertController)
  readonly tenantService = inject(TenantService)

  readonly showCreateForm = signal(false)

  async ngOnInit() {
    await this.tenantService.loadTenants()
  }

  onTenantChange(tenantId: string) {
    this.tenantService.selectTenant(tenantId)
  }

  toggleCreateForm() {
    this.showCreateForm.update((value) => !value)
  }

  async createTenant() {
    const alert = await this.alertController.create({
      header: 'Connect to a new database',
      message:
        'Your connection string will be stored securely using encryption.',
      inputs: [
        {
          name: 'dbConnectionString',
          type: 'text',
          placeholder: 'mongodb://localhost:27017',
          attributes: {
            required: true,
          },
        },
        {
          name: 'dbName',
          type: 'text',
          placeholder: 'Database name',
          attributes: {
            required: true,
          },
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Connect',
          role: 'confirm',
          handler: async (data) => {
            if (!data.dbConnectionString || !data.dbName) {
              return false
            }
            try {
              await this.tenantService.createTenant(
                data.dbConnectionString,
                data.dbName,
                {}
              )
              this.showCreateForm.set(false)
              return true
            } catch (error) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to create tenant',
                buttons: ['OK'],
              })
              await errorAlert.present()
              return false
            }
          },
        },
      ],
    })

    await alert.present()
  }

  async disconnectTenant(tenantId: string) {
    // Prevent disconnecting active tenant
    if (this.tenantService.selectedTenantId() === tenantId) {
      const errorAlert = await this.alertController.create({
        header: 'Cannot Disconnect Active Database',
        message:
          'You cannot disconnect the currently active database. Please switch to another database first.',
        buttons: ['OK'],
      })
      await errorAlert.present()
      return
    }

    const alert = await this.alertController.create({
      header: 'Disconnect Database',
      message:
        'Are you sure you want to disconnect from this database? Note: The actual database will NOT be deleted, only the connection configuration in this app.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Disconnect',
          role: 'destructive',
          handler: async () => {
            try {
              await this.tenantService.deleteTenant(tenantId)
              return true
            } catch (error) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to disconnect database',
                buttons: ['OK'],
              })
              await errorAlert.present()
              return false
            }
          },
        },
      ],
    })

    await alert.present()
  }
}
