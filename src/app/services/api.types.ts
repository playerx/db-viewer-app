import { ObjectId } from 'bson'

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface FilterItem {
  field: string
  operator: string
  value: string
}

export interface PaginationInfo {
  skip: number
  limit: number
  total: number
  hasMore: boolean
}

export interface DocumentData {
  _id?: ObjectId | string
  [key: string]: unknown
}

export interface TransformJsonData {
  result: string
  data: Object
  debug: {
    index: number
    step: string
    content: string
  }[]
}

export interface CollectionResponse {
  data: DocumentData[]
  pagination: PaginationInfo
}

export interface DeleteResponse {
  success: boolean
  deletedCount: number
}

export interface EventLog {
  _id: string
  type: 'UPDATE' | 'DELETE' | 'QUERY'
  collection?: string
  id?: string
  timestamp: string
  data?: Record<string, unknown>
  queries?: string[]
  results?: (number | Record<string, unknown>)[]
}

export interface DebugStep {
  index: number
  step: string
  content: string
}

export interface PromptLog {
  _id: string
  prompt: string
  result: string
  queries: string[]
  timestamp: string
  lastUsedAt: string
  debug?: {
    messages: DebugStep[]
  }
}

export interface PromptLogsResponse {
  data: PromptLog[]
  pagination: PaginationInfo
}

export interface EventsResponse {
  events: EventLog[]
  pagination: PaginationInfo
}

export interface PromptUpdate {
  step: string
  content: string
}

export interface PromptComplete {
  result: string[]
  debug: DebugStep[]
}

export interface PromptError {
  error: string
}

export interface Tenant {
  id: string
  dbName: string
  hostname: string
  displayConfig: Record<string, string[]>
}

export interface TenantsResponse {
  tenants: Tenant[]
}

export interface CreateTenantRequest {
  dbConnectionString: string
  dbName: string
  displayConfig: Record<string, string[]>
}

export interface CreateTenantResponse {
  tenant: Tenant
}
