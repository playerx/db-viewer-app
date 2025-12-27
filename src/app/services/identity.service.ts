import { Injectable, signal } from '@angular/core'
import { jok, type UserAuthData } from '@jokio/sdk'

@Injectable({ providedIn: 'root' })
export class IdentityService {
  user = signal<UserAuthData>({
    name: '',
    email: '',
    sessionId: '',
    userId: '',
    verified: false,
    nats: {} as any,
  })

  isAuthenticated: Promise<void>
  private isAuthenticatedResolver: () => void = () => {}

  constructor() {
    this.isAuthenticated = new Promise<void>(
      resolve => (this.isAuthenticatedResolver = resolve),
    )
  }

  load() {
    return new Promise<boolean>(resolve => {
      jok.auth.getLastLoginData().then(async x => {
        if (!x) {
          const res = await jok.auth.guestLogin()
          this.user.set(res)
        } else {
          this.user.set(x)
        }

        // migration logic
        if (!(await jok.auth.getAccessToken())) {
          await this.signOut()
        }
        // migration logic

        this.isAuthenticatedResolver()

        resolve(true)
      })
    })
  }

  async requestEmailLogin(email: string, returnUrl: string) {
    return jok.auth.requestEmailLogin(email, returnUrl)
  }

  async completeEmailLogin(email: string, otpCode: string) {
    const res = await jok.auth.completeEmailLogin(email, otpCode)

    this.user.set(res)

    return res
  }

  async requestPasskeyLogin(
    displayName: string = '',
    isRegistration: boolean = false,
    addAsAdditionalDevice = false,
  ) {
    const res = await jok.auth.requestPasskeyLogin({
      displayName,
      isRegistration,
      addAsAdditionalDevice,
    })

    this.user.set(res)

    return res
  }

  async signOut() {
    this.user.set({
      verified: false,
      email: '',
      name: '',
      sessionId: '',
      userId: '',
      nats: {} as any,
    })

    jok.auth.signOut()

    const res = await jok.auth.guestLogin()
    this.user.set(res)

    return res
  }

  isValidNickname(nickname: string | undefined) {
    if (!nickname) {
      return false
    }

    if (nickname.length < 3) {
      return false
    }

    if (nickname.length > 15) {
      return false
    }

    if (!/^[0-9a-zA-Z]*$/.test(nickname)) {
      return false
    }

    return true
  }
}
