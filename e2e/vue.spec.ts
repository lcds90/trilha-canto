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

test('reorders exercises in section edit mode', async ({ page }) => {
  await page.goto('/?section=1')

  // Open edit mode via keypress 'e'
  await page.keyboard.press('e')

  // Check edit mode container is open
  const editContainer = page.locator('.edit-mode-container')
  await expect(editContainer).toBeVisible()

  // Get edit cards
  const cards = editContainer.locator('.edit-card')
  await expect(cards).toHaveCount(4)

  // Grab the names of first and second exercise inputs
  const firstInput = cards.nth(0).locator('.edit-input.font-bold')
  const secondInput = cards.nth(1).locator('.edit-input.font-bold')
  
  const firstTitle = await firstInput.inputValue()
  const secondTitle = await secondInput.inputValue()

  // First card "up" button is disabled
  const firstUpBtn = cards.nth(0).locator('.reorder-btn', { hasText: '▲' })
  await expect(firstUpBtn).toBeDisabled()

  // Move first exercise down
  const firstDownBtn = cards.nth(0).locator('.reorder-btn', { hasText: '▼' })
  await expect(firstDownBtn).toBeEnabled()
  await firstDownBtn.click()

  // Now the first card should have the old secondTitle
  await expect(cards.nth(0).locator('.edit-input.font-bold')).toHaveValue(secondTitle)
  // And the second card should have the old firstTitle
  await expect(cards.nth(1).locator('.edit-input.font-bold')).toHaveValue(firstTitle)

  // Move it back up
  const newSecondUpBtn = cards.nth(1).locator('.reorder-btn', { hasText: '▲' })
  await newSecondUpBtn.click()

  // Restored
  await expect(cards.nth(0).locator('.edit-input.font-bold')).toHaveValue(firstTitle)
  await expect(cards.nth(1).locator('.edit-input.font-bold')).toHaveValue(secondTitle)

  // Exit edit mode
  await page.keyboard.press('Escape')
  await expect(editContainer).toBeHidden()
})

test('reorders exercises via drag and drop', async ({ page }) => {
  await page.goto('/?section=1&isEdit=true')

  const editContainer = page.locator('.edit-mode-container')
  await expect(editContainer).toBeVisible()

  const cards = editContainer.locator('.edit-card')
  await expect(cards).toHaveCount(4)

  const firstTitle = await cards.nth(0).locator('.edit-input.font-bold').inputValue()
  const secondTitle = await cards.nth(1).locator('.edit-input.font-bold').inputValue()

  // Dispatch HTML5 DragEvent from first handle to second card
  await cards.nth(0).locator('.drag-handle').dispatchEvent('dragstart')
  await cards.nth(1).dispatchEvent('dragover')
  await cards.nth(1).dispatchEvent('drop')
  await cards.nth(0).locator('.drag-handle').dispatchEvent('dragend')

  // Check new order
  await expect(cards.nth(0).locator('.edit-input.font-bold')).toHaveValue(secondTitle)
  await expect(cards.nth(1).locator('.edit-input.font-bold')).toHaveValue(firstTitle)
})


