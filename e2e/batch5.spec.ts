import { expect, test, type Page } from '@playwright/test'

// Batch 5 (2026-11-17): more Syrian ornament, and the shawarma spit and city sweets in CSS 3D.

const noSideScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
const angle = (page: Page, sel: string) => page.locator(sel).evaluate((el) => (el as HTMLElement).style.transform)

test('ornament is decoration: hidden from readers, never in the way, no sideways scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  for (const path of ['/', '/cities/damascus', '/cities/latakia', '/outside', '/en/about']) {
    await page.goto(path)
    await noSideScroll(page)
    for (const el of await page.locator('.pat-tile, .muq-edge, .shamsa').all()) {
      await expect(el).toHaveAttribute('aria-hidden', 'true')
      expect(await el.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none')
    }
  }
  await page.goto('/')
  await expect(page.locator('.home-hero .shamsa')).toBeAttached()
  await expect(page.locator('.home-hero .muq-edge')).toBeAttached()
  // The links under the patterns still take the press.
  await page.locator('.home-hero .door').first().click()
  await expect(page).toHaveURL(/\/inside$/)
})

test('the spit: a drag turns it without carving, the keyboard turns and carves it', async ({ page }) => {
  await page.goto('/')
  const spit = page.locator('.shw3-stage .stage')
  await spit.scrollIntoViewIfNeeded()
  await expect(page.locator('.shw3 .face').first()).toBeAttached()
  const box = (await spit.boundingBox())!
  const before = await angle(page, '.shw3 .turn')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  expect(await angle(page, '.shw3 .turn')).not.toBe(before)
  await expect(page.locator('.shw3-steps li.is-done')).toHaveCount(0)

  await spit.focus()
  const turned = await angle(page, '.shw3 .turn')
  await page.keyboard.press('ArrowLeft')
  expect(await angle(page, '.shw3 .turn')).not.toBe(turned)
  await page.keyboard.press('Enter')
  await expect(page.locator('.shw3-steps li.is-done')).toHaveCount(1)
  await expect(page.locator('.shw3-actions [aria-live]')).toHaveText('اللحم بالصينية تحت السيخ.')
})

test('the sweet tray: a drag turns it and keeps the chosen sweet; one-sweet cities have no picker', async ({ page }) => {
  await page.goto('/cities/aleppo')
  const stage = page.locator('#sweets .swt3-stage')
  await stage.scrollIntoViewIfNeeded()
  await expect(page.locator('#sweets .bit').first()).toBeAttached()
  const box = (await stage.boundingBox())!
  const before = await angle(page, '#sweets .turn')
  await page.mouse.move(box.x + box.width / 2, box.y + 40)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 90, box.y + 40, { steps: 6 })
  await page.mouse.up()
  expect(await angle(page, '#sweets .turn')).not.toBe(before)
  await expect(page.locator('#sweets .swt3-kinds button').first()).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/en/cities/latakia')
  await expect(page.locator('#sweets .swt3-kinds')).toHaveCount(0)
  await expect(page.locator('#sweets .swt3-card h3')).toHaveText('Jazariyeh (carrot sweet)')
})

test('reduced motion: nothing in the 3D pieces or the ornament keeps moving', async ({ page }) => {
  const moving = () =>
    page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('.shw3, .swt3, .shamsa')).length)
  await page.goto('/cities/damascus')
  await page.locator('#sweets .swt3-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('#sweets .bit').first()).toBeAttached()
  expect(await moving()).toBe(0)
  await page.goto('/')
  await page.locator('.shw3-stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.shw3 .face').first()).toBeAttached()
  expect(await moving()).toBe(0)
})
