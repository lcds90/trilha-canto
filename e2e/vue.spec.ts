import { test, expect } from '@playwright/test'

test('loads app and interacts with metronome and player', async ({ page }) => {
  await page.goto('/')

  // App title
  await expect(page.locator('.app-title')).toBeVisible()

  // Roadmap scene exists
  await expect(page.locator('.roadmap-container')).toBeVisible()

  // Metronome widget is present
  const metronome = page.locator('.metronome-widget')
  await expect(metronome).toBeVisible()

  // Test BPM and Metronome Controls
  await expect(metronome.locator('.title-text')).toHaveText('Metrônomo')
  const miniPlayBtn = metronome.locator('.mini-play-btn')
  await expect(miniPlayBtn).toBeVisible()

  // Click play on metronome
  await miniPlayBtn.click()

  // Scene HUD should appear while metronome is playing
  const sceneHud = page.locator('.scene-metronome-hud')
  await expect(sceneHud).toBeVisible()

  // Increment BPM
  const plusBtn = metronome.locator('.step-btn', { hasText: '+5' })
  await plusBtn.click()

  // Verify meter presets
  const meter3Btn = metronome.locator('.meter-chip', { hasText: '3/4' })
  await meter3Btn.click()
  await expect(metronome.locator('.current-meter-tag')).toHaveText('3/4')

  // Verify beat dots count equals 3
  const beatDots = metronome.locator('.beat-dot')
  await expect(beatDots).toHaveCount(3)

  // Test sound selector
  const soundBellBtn = metronome.locator('.sound-btn', { hasText: 'Digital' })
  await soundBellBtn.click()
  await expect(soundBellBtn).toHaveClass(/active/)

  // Stop via scene HUD
  const hudStopBtn = sceneHud.locator('.hud-stop-icon')
  await hudStopBtn.click()
  await expect(sceneHud).toBeHidden()
})
