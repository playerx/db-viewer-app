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
      header: 'Create New Tenant',
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

  async deleteTenant(tenantId: string) {
    const alert = await this.alertController.create({
      header: 'Delete Tenant',
      message:
        'Are you sure you want to delete this tenant configuration? Note: The actual database will NOT be deleted, only the tenant configuration in this app.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
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
                    : 'Failed to delete tenant',
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
