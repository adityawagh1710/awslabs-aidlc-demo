import { buildApp } from '../../src/app'

export async function buildTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}
