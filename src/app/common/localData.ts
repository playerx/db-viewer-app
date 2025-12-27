import { effect, signal, WritableSignal } from '@angular/core'
import type { StorageApi } from '../services/storage.service.js'

export type LocalData<T> = WritableSignal<T> & {
  load(): Promise<void>
}

export const localData = <T>(
  initialData: T,
  opts: {
    storage: StorageApi
    storageKey: string
  }
) => {
  const { storage, storageKey } = opts

  const x = signal(initialData)

  storage.getItem(storageKey).then((savedData: any) => {
    if (!savedData) {
      return
    }

    x.set(savedData)
  })

  effect(async () => {
    const data = x()

    try {
      await storage.setItem(storageKey, data)
    } catch (err) {
      console.error('[localData] save failed', err)
    }
  })

  const res: LocalData<T> = Object.assign(x, {
    async load() {
      try {
        const data = await storage.getItem(storageKey)

        if (data) {
          x.set(data as T)
        }
      } catch (err) {
        console.error('[localData] load failed', err)
      }
    },
  })

  return res
}

export const loadFromStorage =
  (storage: StorageApi, key: string) => async () => {
    const data = await storage.getItem(key)
    if (!data) {
      return null
    }

    return data
  }

export const loadFromApi = (apiUrl: string) => async () => {
  const data = await fetch(apiUrl).then((x) => x.json())
  if (!data) {
    return null
  }

  return data
}
