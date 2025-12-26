import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../environments/environment'
import {
  CollectionResponse,
  CreateTenantRequest,
  CreateTenantResponse,
  DeleteResponse,
  DocumentData,
  EventLog,
  EventsResponse,
  PaginationParams,
  PromptLog,
  PromptLogsResponse,
  TenantsResponse,
  type TransformJsonData,
} from './api.types'
import { StorageService } from './storage.service'

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient)
  private readonly storage = inject(StorageService)
  private readonly baseUrl = environment.apiUrl

  private getHeaders(): HttpHeaders {
    const tenantId = this.storage.get<string>('selectedTenantId')
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
    if (tenantId) {
      headers = headers.set('x-tenant-id', tenantId)
    }
    return headers
  }

  // Tenant API
  async getTenants(): Promise<TenantsResponse> {
    return firstValueFrom(
      this.http.get<TenantsResponse>(`${this.baseUrl}/tenants`)
    )
  }

  async createTenant(
    request: CreateTenantRequest
  ): Promise<CreateTenantResponse> {
    return firstValueFrom(
      this.http.post<CreateTenantResponse>(`${this.baseUrl}/tenants`, request, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      })
    )
  }

  async deleteTenant(tenantId: string): Promise<CreateTenantResponse> {
    return firstValueFrom(
      this.http.delete<CreateTenantResponse>(
        `${this.baseUrl}/tenants/${tenantId}`,
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
          }),
        }
      )
    )
  }

  // Data API
  async getCollections(): Promise<string[]> {
    return firstValueFrom(
      this.http.get<{ collections: string[] }>(
        `${this.baseUrl}/data/collections`,
        {
          headers: this.getHeaders(),
        }
      )
    ).then((x) => x.collections)
  }

  async getDocuments(
    collection: string,
    params?: PaginationParams & Record<string, unknown>
  ): Promise<CollectionResponse> {
    let httpParams = new HttpParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString())
        }
      })
    }
    return firstValueFrom(
      this.http.get<CollectionResponse>(`${this.baseUrl}/data/${collection}`, {
        params: httpParams,
        headers: this.getHeaders(),
      })
    )
  }

  async getDocumentById(collection: string, id: string): Promise<DocumentData> {
    return firstValueFrom(
      this.http.get<DocumentData>(`${this.baseUrl}/data/${collection}/${id}`, {
        headers: this.getHeaders(),
      })
    )
  }

  async updateDocument(
    collection: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<DocumentData> {
    return firstValueFrom(
      this.http.put<DocumentData>(
        `${this.baseUrl}/data/${collection}/${id}`,
        data,
        {
          headers: this.getHeaders(),
        }
      )
    )
  }

  async jsonTransform(
    json: string,
    prompt: string
  ): Promise<TransformJsonData> {
    return firstValueFrom(
      this.http.post<TransformJsonData>(
        `${this.baseUrl}/transform`,
        { json, prompt },
        {
          headers: this.getHeaders(),
        }
      )
    )
  }

  async deleteDocument(
    collection: string,
    id: string
  ): Promise<DeleteResponse> {
    return firstValueFrom(
      this.http.delete<DeleteResponse>(
        `${this.baseUrl}/data/${collection}/${id}`,
        {
          headers: this.getHeaders(),
        }
      )
    )
  }

  async runQueries(queries: string[], promptLogId: string) {
    return firstValueFrom(
      this.http.post<any[]>(
        `${this.baseUrl}/data/queries?promptLogId=${promptLogId}`,
        queries,
        {
          headers: this.getHeaders(),
        }
      )
    )
  }

  // Events API
  async getEvents(
    params?: PaginationParams & { debug?: boolean }
  ): Promise<EventLog[] | EventsResponse> {
    let httpParams = new HttpParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString())
        }
      })
    }
    return firstValueFrom(
      this.http.get<EventLog[] | EventsResponse>(`${this.baseUrl}/events`, {
        params: httpParams,
        headers: this.getHeaders(),
      })
    )
  }

  async deleteEvent(id: string): Promise<DeleteResponse> {
    return firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.baseUrl}/events/${id}`, {
        headers: this.getHeaders(),
      })
    )
  }

  // Prompt API - returns the URL for EventSource SSE connection
  getPromptUrl(prompt: string): string {
    const tenantId = this.storage.get<string>('selectedTenantId')
    let params = new HttpParams().set('prompt', prompt)
    if (tenantId) {
      params = params.set('x-tenant-id', tenantId)
    }
    return `${this.baseUrl}/prompt?${params.toString()}`
  }

  // Prompt Logs API
  async getPromptLogs(params?: PaginationParams): Promise<PromptLogsResponse> {
    let httpParams = new HttpParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString())
        }
      })
    }
    return firstValueFrom(
      this.http.get<PromptLogsResponse>(`${this.baseUrl}/prompt/log`, {
        params: httpParams,
        headers: this.getHeaders(),
      })
    )
  }

  async getPromptLogById(id: string, debug?: boolean): Promise<PromptLog> {
    let httpParams = new HttpParams()
    if (debug) {
      httpParams = httpParams.set('debug', 'true')
    }
    return firstValueFrom(
      this.http.get<PromptLog>(`${this.baseUrl}/prompt/log/${id}`, {
        params: httpParams,
        headers: this.getHeaders(),
      })
    )
  }

  async deletePromptLog(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return firstValueFrom(
      this.http.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/prompt/log/${id}`,
        {
          headers: this.getHeaders(),
        }
      )
    )
  }
}
