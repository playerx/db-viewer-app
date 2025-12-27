import { isPlatformBrowser } from '@angular/common'
import { Inject, Injectable, PLATFORM_ID } from '@angular/core'

export type StorageApi = {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<void>
  removeItem<T>(key: string): Promise<void>
}

/**
 * Supports server-side rendering
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService implements StorageApi {
  private isBrowser: boolean

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId)
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.isBrowser) {
      return null
    }

    const data = localStorage.getItem(key)
    if (!data) {
      return null
    }

    try {
      const res = JSON.parse(data, jsonReviver)

      return res
    } catch {
      return null
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(value, jsonReplacer))
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.isBrowser) {
      localStorage.removeItem(key)
    }
  }
}

export const jsonReplacer = (_: string, value: unknown) => {
  if (value instanceof Map)
    return { __type: 'Map', value: Array.from(value.entries()) }

  if (value instanceof Set) return { __type: 'Set', value: Array.from(value) }

  if (typeof value === 'bigint')
    return { __type: 'BigInt', value: value.toString() }

  // it will never happen :(
  if (value instanceof Date)
    return { __type: 'Date', value: value.toISOString() }

  if (typeof value === 'string' && value.endsWith('Z') && value.length === 24) {
    try {
      const res = Date.parse(value)
      if (res) {
        return {
          __type: 'Date',
          value: res,
        }
      }
    } catch {
      // do nothing
    }
  }

  return value
}

export const jsonReviver = (
  _: string,
  value: { __type: string; value: any }
) => {
  if (!value || typeof value !== 'object') {
    return value
  }

  switch (value.__type) {
    case 'Map':
      return new Map(value.value)

    case 'Set':
      return new Set(value.value)

    case 'Date':
      return new Date(value.value)

    case 'BigInt':
      return BigInt(value.value)

    default:
      return value
  }
}
