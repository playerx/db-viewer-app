import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../environments/environment'
import {
  CollectionResponse,
  DeleteResponse,
  DocumentData,
  EventLog,
  EventsResponse,
  PaginationParams,
  PromptLog,
  PromptLogsResponse,
} from './api.types'

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = environment.apiUrl

  // Data API
  async getCollections(): Promise<string[]> {
    return firstValueFrom(
      this.http.get<{ collections: string[] }>(
        `${this.baseUrl}/data/collections`
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
      })
    )
  }

  async getDocumentById(collection: string, id: string): Promise<DocumentData> {
    return firstValueFrom(
      this.http.get<DocumentData>(`${this.baseUrl}/data/${collection}/${id}`)
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
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
          }),
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
        `${this.baseUrl}/data/${collection}/${id}`
      )
    )
  }

  async runQueries(queries: string[], promptLogId: string) {
    return firstValueFrom(
      this.http.post<any[]>(
        `${this.baseUrl}/data/queries?promptLogId=${promptLogId}`,
        queries
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
      })
    )
  }

  async deleteEvent(id: string): Promise<DeleteResponse> {
    return firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.baseUrl}/events/${id}`)
    )
  }

  // Prompt API - returns the URL for EventSource SSE connection
  getPromptUrl(prompt: string): string {
    const params = new HttpParams().set('prompt', prompt)
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
      })
    )
  }

  async deletePromptLog(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return firstValueFrom(
      this.http.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/prompt/log/${id}`
      )
    )
  }
}
