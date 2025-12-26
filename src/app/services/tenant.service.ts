import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { ApiService } from './api.service'
import { Tenant } from './api.types'
import { StorageService } from './storage.service'

export type TenantChangeCallback = (tenantId: string | null) => void

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private readonly api = inject(ApiService)
  private readonly storage = inject(StorageService)
  private readonly platformId = inject(PLATFORM_ID)
  private tenantChangeCallbacks: TenantChangeCallback[] = []

  private readonly tenantsSignal = signal<Tenant[]>([])
  private readonly selectedTenantIdSignal = signal<string | null>(null)
  private readonly loadingSignal = signal<boolean>(false)
  private readonly errorSignal = signal<string | null>(null)

  readonly tenants = this.tenantsSignal.asReadonly()
  readonly selectedTenantId = this.selectedTenantIdSignal.asReadonly()
  readonly loading = this.loadingSignal.asReadonly()
  readonly error = this.errorSignal.asReadonly()

  readonly selectedTenant = computed(() => {
    const tenantId = this.selectedTenantIdSignal()
    const tenants = this.tenantsSignal()
    return tenants.find((t) => t.id === tenantId) || null
  })

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const storedTenantId = this.storage.get<string>('selectedTenantId')
      if (storedTenantId) {
        this.selectedTenantIdSignal.set(storedTenantId)
      }
    }

    // Effect to notify listeners when tenant changes
    effect(() => {
      const tenantId = this.selectedTenantIdSignal()
      this.notifyTenantChange(tenantId)
    })
  }

  onTenantChange(callback: TenantChangeCallback): () => void {
    this.tenantChangeCallbacks.push(callback)
    // Return unsubscribe function
    return () => {
      this.tenantChangeCallbacks = this.tenantChangeCallbacks.filter(
        (cb) => cb !== callback
      )
    }
  }

  private notifyTenantChange(tenantId: string | null): void {
    this.tenantChangeCallbacks.forEach((callback) => {
      callback(tenantId)
    })
  }

  async loadTenants(): Promise<void> {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)
    try {
      const response = await this.api.getTenants()
      this.tenantsSignal.set(response.tenants)
    } catch (error) {
      this.errorSignal.set(
        error instanceof Error ? error.message : 'Failed to load tenants'
      )
      throw error
    } finally {
      this.loadingSignal.set(false)
    }
  }

  async createTenant(
    dbConnectionString: string,
    dbName: string,
    displayConfig: Record<string, string[]>
  ): Promise<Tenant> {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)
    try {
      const response = await this.api.createTenant({
        dbConnectionString,
        dbName,
        displayConfig,
      })
      await this.loadTenants()
      this.selectTenant(response.tenant.id)
      return response.tenant
    } catch (error) {
      this.errorSignal.set(
        error instanceof Error ? error.message : 'Failed to create tenant'
      )
      throw error
    } finally {
      this.loadingSignal.set(false)
    }
  }

  selectTenant(tenantId: string | null): void {
    this.selectedTenantIdSignal.set(tenantId)
    if (tenantId) {
      this.storage.set('selectedTenantId', tenantId)
    } else {
      this.storage.remove('selectedTenantId')
    }
  }

  async deleteTenant(tenantId: string): Promise<void> {
    this.loadingSignal.set(true)
    this.errorSignal.set(null)
    try {
      await this.api.deleteTenant(tenantId)
      // If the deleted tenant was selected, clear selection
      if (this.selectedTenantIdSignal() === tenantId) {
        this.selectTenant(null)
      }
      await this.loadTenants()
    } catch (error) {
      this.errorSignal.set(
        error instanceof Error ? error.message : 'Failed to delete tenant'
      )
      throw error
    } finally {
      this.loadingSignal.set(false)
    }
  }
}
