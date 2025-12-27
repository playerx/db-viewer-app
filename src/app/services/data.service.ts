import { Injectable, signal } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly refreshTrigger = signal(0)

  getRefreshTrigger() {
    return this.refreshTrigger.asReadonly()
  }

  triggerRefresh() {
    this.refreshTrigger.update((v) => v + 1)
  }
}
