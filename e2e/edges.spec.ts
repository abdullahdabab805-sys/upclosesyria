import { expect, test, type Page } from "@playwright/test";

// Animated edge bands (2026-11-23): two pattern strips down the sides of <main>, the left one rising and the
// right one falling, like Ahleen's about page but with our own pattern (public/patterns/edge-band.svg).

const PAGES = ["/", "/cities/damascus", "/outside", "/en/about"];
const noSideScroll = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
/** The vertical offset of a band's moving layer, read from its running transform. */
const shift = (page: Page, side: "l" | "r") =>
  page
    .locator(`.edge-band.${side}`)
    .evaluate(
      (el) =>
        new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).m42,
    );

test("the bands are decoration on every page: hidden from readers, never in the way, no sideways scroll at 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of PAGES) {
    await page.goto(path);
    await noSideScroll(page);
    const bands = page.locator("main#main > .edge-band");
    await expect(bands).toHaveCount(2);
    for (const band of await bands.all()) {
      await expect(band).toHaveAttribute("aria-hidden", "true");
      expect(
        await band.evaluate((e) => getComputedStyle(e).pointerEvents),
      ).toBe("none");
      // The band runs the whole height of the page body.
      expect(
        await band.evaluate((e) => e.getBoundingClientRect().height),
      ).toBeGreaterThan(780);
    }
  }
  // The links next to the bands still take the press.
  await page.goto("/");
  await page.locator(".home-hero .door").first().click();
  await expect(page).toHaveURL(/\/inside$/);
});

test.describe("with motion", () => {
  // The config turns motion off for every test; the bands' motion is what this one checks.
  test.use({ reducedMotion: "no-preference" });
  test("the left band rises and the right band falls", async ({ page }) => {
    await page.goto("/");
    const [l0, r0] = [await shift(page, "l"), await shift(page, "r")];
    await page.waitForTimeout(1500);
    const [l1, r1] = [await shift(page, "l"), await shift(page, "r")];
    // Under 12s a cycle the loop cannot wrap twice in 1.5s, so one wrap at most; compare modulo a tile.
    const tile = await page.evaluate(() =>
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--edge-h"),
      ),
    );
    const moved = (a: number, b: number) => (((b - a) % tile) + tile) % tile;
    expect(moved(l0, l1)).toBeGreaterThan(tile / 2); // went up (negative), so modulo it lands in the upper half
    expect(moved(r0, r1)).toBeGreaterThan(0);
    expect(moved(r0, r1)).toBeLessThan(tile / 2); // went down
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the bands stand still", async ({ page }) => {
    await page.goto("/cities/damascus");
    for (const side of ["l", "r"] as const) {
      expect(
        await page
          .locator(`.edge-band.${side}`)
          .evaluate((el) => getComputedStyle(el, "::before").animationName),
      ).toBe("none");
    }
  });
});
