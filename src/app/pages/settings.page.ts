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
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone'
import { IdentityService } from '../services/identity.service'
import { MenuService } from '../services/menu.service'
import { TenantService } from '../services/tenant.service'

@Component({
  selector: 'app-settings',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonButton,
    IonSpinner,
    IonNote,
    FormsModule,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ion-content {
      --background: var(--ion-background-color, #f4f5f8);
    }

    section.container {
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      justify-self: center;
      width: 100%;
    }

    ion-list {
      margin-bottom: 20px;
    }

    .loadingContainer {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 0;
      width: 100%;
    }

    .listNote {
      display: block;
      padding: 12px 16px;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .tenantItem {
      --inner-padding-end: 0;
      --padding-start: 16px;
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

      .tenantContent ion-label {
        margin-bottom: 0.25rem;
      }
    }
  `,
})
export class SettingsPage {
  private readonly alertController = inject(AlertController)
  readonly menuService = inject(MenuService)
  readonly tenantService = inject(TenantService)
  readonly identityService = inject(IdentityService)

  readonly showCreateForm = signal(false)

  async ngOnInit() {
    await this.tenantService.loadTenants()
  }

  async onMenuPositionChange(position: 'start' | 'end') {
    await this.menuService.setMenuPosition(position)
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
      backdropDismiss: false,
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

  async signInWithPasskey() {
    try {
      await this.identityService.requestPasskeyLogin('', true)
      // Reload tenants after successful sign-in
      await this.tenantService.loadTenants()
    } catch (error) {
      const errorAlert = await this.alertController.create({
        header: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to sign in with passkey',
        buttons: ['OK'],
      })
      await errorAlert.present()
    }
  }

  async signInWithEmail() {
    // Step 1: Request email
    const emailAlert = await this.alertController.create({
      header: 'Sign In with Email',
      message: 'Enter your email address to receive a verification code.',
      backdropDismiss: false,
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'your@email.com',
          attributes: {
            required: true,
            autocomplete: 'email',
          },
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Send Code',
          role: 'confirm',
          handler: async (data) => {
            if (!data.email) {
              return false
            }

            try {
              // Request the email login code
              await this.identityService.requestEmailLogin(
                data.email,
                window.location.origin
              )

              // Step 2: Request verification code
              await this.showEmailCodeVerification(data.email)
              return true
            } catch (error) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to send verification code',
                buttons: ['OK'],
              })
              await errorAlert.present()
              return false
            }
          },
        },
      ],
    })

    await emailAlert.present()
  }

  private async showEmailCodeVerification(email: string) {
    const codeAlert = await this.alertController.create({
      header: 'Enter Verification Code',
      message: `We've sent a verification code to ${email}. Please enter it below.`,
      backdropDismiss: false,
      inputs: [
        {
          name: 'code',
          type: 'text',
          placeholder: 'Enter code',
          attributes: {
            required: true,
            maxlength: 6,
          },
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Verify',
          role: 'confirm',
          handler: async (data) => {
            if (!data.code) {
              return false
            }

            try {
              await this.identityService.completeEmailLogin(email, data.code)
              // Reload tenants after successful sign-in
              await this.tenantService.loadTenants()
              return true
            } catch (error) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Failed to verify code',
                buttons: ['OK'],
              })
              await errorAlert.present()
              return false
            }
          },
        },
      ],
    })

    await codeAlert.present()
  }

  async signOut() {
    const alert = await this.alertController.create({
      header: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Sign Out',
          role: 'destructive',
          handler: async () => {
            try {
              await this.identityService.signOut()
              // Clear tenants after sign out
              await this.tenantService.loadTenants()
              return true
            } catch (error) {
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message:
                  error instanceof Error ? error.message : 'Failed to sign out',
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
