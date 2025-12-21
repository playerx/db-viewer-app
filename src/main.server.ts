import {
  BootstrapContext,
  bootstrapApplication,
} from '@angular/platform-browser'
import { config } from './app/app.config.server'
import { App } from './app/layouts/app'

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context)

export default bootstrap
