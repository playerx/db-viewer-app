import { HttpClient, HttpParams } from '@angular/common/http'
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
        data
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
    return `${this.baseUrl}/data/prompt?${params.toString()}`
  }
}
