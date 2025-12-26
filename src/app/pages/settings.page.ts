import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core'
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
  IonNote,
  IonRadioGroup,
  IonRadio,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  AlertController,
} from '@ionic/angular/standalone'
import { TenantService } from '../services/tenant.service'
import { FormsModule } from '@angular/forms'

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
    IonRadioGroup,
    IonRadio,
    IonInput,
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
          text: 'Create',
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
}
