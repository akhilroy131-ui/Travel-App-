import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const projectFile = (path) => new URL(`../${path}`, import.meta.url)

test('the native map uses Mapbox and has a safe no-token fallback', async () => {
  const [packageJson, appConfig, mapScreen] = await Promise.all([
    readFile(projectFile('package.json'), 'utf8').then(JSON.parse),
    readFile(projectFile('app.config.js'), 'utf8'),
    readFile(projectFile('screens/map/MapScreen.tsx'), 'utf8'),
  ])

  assert.ok(packageJson.dependencies['@rnmapbox/maps'])
  assert.equal(packageJson.dependencies['react-native-maps'], undefined)
  assert.match(appConfig, /@rnmapbox\/maps/)
  assert.match(appConfig, /EXPO_PUBLIC_MAPBOX_TOKEN/)
  assert.match(mapScreen, /@rnmapbox\/maps/)
  assert.doesNotMatch(mapScreen, /react-native-maps/)
  assert.match(mapScreen, /if \(!mapboxToken\)/)
  assert.match(mapScreen, /Map setup required/)
})
