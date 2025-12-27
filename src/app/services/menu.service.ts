import { inject, Injectable, signal } from '@angular/core'
import { StorageService } from './storage.service'

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly storageService = inject(StorageService)

  readonly menuPosition = signal<'start' | 'end'>('start')

  async init() {
    const position = await this.storageService.getItem<'start' | 'end'>(
      'menuPosition'
    )
    if (position) {
      this.menuPosition.set(position)
    }
  }

  async setMenuPosition(position: 'start' | 'end') {
    this.menuPosition.set(position)
    await this.storageService.setItem('menuPosition', position)
  }
}
