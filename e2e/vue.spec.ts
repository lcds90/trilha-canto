import { test, expect } from '@playwright/test'

test('loads app and interacts with metronome and player', async ({ page }) => {
  await page.goto('/')

  // App title
  await expect(page.locator('.app-title')).toBeVisible()

  // Roadmap scene exists
  await expect(page.locator('.roadmap-container')).toBeVisible()

  // Metronome widget is present
  const metronome = page.locator('.unified-practice-widget')
  await expect(metronome).toBeVisible()

  // Test BPM and Metronome Controls
  await expect(metronome.locator('.header-title')).toContainText('Metrônomo')
  const playBtn = metronome.locator('.main-toggle-btn')
  await expect(playBtn).toBeVisible()

  // Click play on metronome
  await playBtn.click()

  // Scene HUD should appear while metronome is playing
  const sceneHud = page.locator('.scene-metronome-hud')
  await expect(sceneHud).toBeVisible()

  // Increment BPM
  const plusBtn = metronome.locator('.micro-btn', { hasText: '+5' })
  await plusBtn.click()

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

test('displays centered workout celebration animation and sound effect when all sections are completed', async ({ page }) => {
  // Pre-populate with all sections completed except the first exercise of section 1
  await page.addInitScript(() => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    const today = d.toISOString().split('T')[0]
    localStorage.setItem('trilha-canto-last-active', today)
    const routine = [
      {
        id: 'respiracao',
        title: 'Respiração e Suporte',
        time: 'Tempo flexível',
        color: '#ffe500',
        completed: false,
        exercises: [
          { id: 'resp-1', name: 'Inspiração e expiração livres', completed: false, videos: [] },
        ],
      },
      {
        id: 'aquecimento-corporal',
        title: 'Aquecimento Corporal',
        time: '+/- 15 min',
        color: '#ffe500',
        completed: true,
        exercises: [
          { id: 'corp-1', name: 'Alongamento e articulações', completed: true, videos: [] },
        ],
      },
    ]
    localStorage.setItem('trilha-canto-routine', JSON.stringify(routine))
  })

  await page.goto('/?section=1')

  // Celebration overlay should not be visible before completion
  await expect(page.locator('.celebration-overlay')).toBeHidden()

  // Click complete on the remaining exercise
  const completeBtn = page.locator('.complete-toggle-pill')
  await expect(completeBtn).toBeVisible()
  await completeBtn.click()

  // The celebration modal MUST now be visible and centered on the screen
  const celebration = page.locator('.celebration-overlay')
  await expect(celebration).toBeVisible()

  // Verify the exact requested text: "Treino concluído 🎉🎈🎤"
  const title = celebration.locator('.celebration-title')
  await expect(title).toBeVisible()
  await expect(title).toHaveText('Treino concluído 🎉🎈🎤')

  // Verify celebration card and buttons exist
  await expect(celebration.locator('.celebration-card')).toBeVisible()
  await expect(celebration.locator('.replay-sound-btn')).toBeVisible()
  await expect(celebration.locator('.continue-btn')).toBeVisible()

  // Test replay sound button interaction
  await celebration.locator('.replay-sound-btn').click()

  // Test closing the celebration via "Continuar" button
  await celebration.locator('.continue-btn').click()
  await expect(celebration).toBeHidden()
})
