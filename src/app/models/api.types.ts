export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface FilterItem {
  field: string
  value: string
}

export interface PaginationInfo {
  skip: number
  limit: number
  total: number
  hasMore: boolean
}

export interface DocumentData {
  _id?: string
  [key: string]: unknown
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
  type: 'UPDATE' | 'DELETE' | 'PROMPT'
  collection?: string
  documentId?: string
  timestamp: string
  data?: Record<string, unknown>
  prompt?: string
  result?: string
  debug?: DebugStep[]
}

export interface DebugStep {
  index: number
  step: string
  content: string
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
  result: string
  debug: DebugStep[]
}

export interface PromptError {
  error: string
}
