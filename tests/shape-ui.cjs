const assert = require("node:assert/strict"),
  { chromium } = require(
    process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
      ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/playwright"
      : "playwright",
  ),
  path = require("node:path"),
  { pathToFileURL } = require("node:url"),
  { setup } = require("./shape-fixture.cjs");
(async () => {
  const e = setup(),
    a = e.shape();
  a.name = "Pilot";
  a.selected = true;
  const b = e.shape();
  b.name = "Other";
  const calls = [];
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 380, height: 720 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.exposeFunction("hostRpc", (p) => {
      calls.push(p);
      return e.rpc(p);
    });
    await page.addInitScript(() => {
      const bridge = {
        isAvailable: () => true,
        isReady: () => true,
        call: async (p) => {
          const r = await hostRpc(p);
          if (!r.ok) throw Error(r.message);
          return r;
        },
      };
      Object.defineProperty(window, "MotionAstraBridge", {
        get: () => bridge,
        set() {},
      });
    });
    const panelUrl = pathToFileURL(path.resolve("index.html")).href;
    await page.goto(panelUrl);
    // Seed the fixture exactly once. An init-script storage read/write runs on
    // every document/reload and can overwrite the data this test must validate.
    await page.evaluate(() => localStorage.setItem("zxt-collections-v1", JSON.stringify({
      favorites: ["core:counter", "yu:1", "core:neongrid"],
      recent: ["core:counter"],
    })));
    await page.reload();
    assert.deepEqual(
      await page.locator("#library-navigation button").allTextContents(),
      ["Text", "Shape", "SolidGen"],
    );
    assert.equal(await page.locator('[data-tab="Media"]').count(), 0);
    await page.locator('[data-tab="Shape"]').click();
    assert.equal(await page.locator("#shape-library .card").count(), 7);
    assert.equal(
      await page
        .locator("#shape-library [data-collection=all]")
        .getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#shape-family-motion summary").click();
    assert(await page.locator("#shape-cards-motion").isHidden());
    await page.locator("#shape-family-motion summary").click();
    await page.locator("#shape-category").selectOption("FX");
    assert.equal(await page.locator("#shape-library .card").count(), 5);
    await page.locator("#shape-category").selectOption("all");
    await page.locator("#shape-search").fill("wiggle");
    assert.equal(await page.locator("#shape-library .card").count(), 1);
    await page.locator("#shape-search").fill("");
    await page
      .getByRole("button", { name: "Favorite Glow", exact: true })
      .click();
    await page.locator("#shape-library [data-collection=favorites]").click();
    assert.equal(await page.locator("#shape-library .card").count(), 1);
    assert.equal(await page.locator("#shape-library h2").textContent(), "Glow");
    await page.locator("#shape-library .shape-select").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-apply").disabled,
    );
    assert(await page.locator("#shape-update").isHidden());
    await page.locator("#shape-apply").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-update").hidden,
    );
    assert(await page.locator("#shape-update").isDisabled());
    await page.locator("#load-fx").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-load").disabled,
    );
    assert.equal(
      calls.filter((p) => p.action !== "status").at(-1).action,
      "shapeLibrary",
    );
    const effects = a.fx.numProperties,
      cti = e.comp.time;
    await page.locator("#shape-param-radius").fill("45");
    await page.locator("#shape-update").click();
    await page.waitForFunction(
      () => document.querySelector("#shape-update").disabled,
    );
    assert.equal(a.fx.numProperties, effects);
    assert.equal(
      e.rpc({ action: "shapeLibrary", operation: "load", id: "glow" }).instance
        .params.radius,
      45,
    );
    await page.locator("#shape-param-radius").fill("48");
    await page.locator("#shape-back").click();
    await page.locator("#shape-library .shape-select").click();
    assert.equal(await page.locator("#shape-param-radius").inputValue(), "48");
    assert(await page.locator("#shape-update").isEnabled());
    a.selected = false;
    b.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Other",
    );
    assert(await page.locator("#shape-update").isDisabled());
    await page.locator("#shape-load").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-apply").hidden,
    );
    assert.equal(b.fx.numProperties, 0);
    await page.locator("#shape-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Pilot",
    );
    await page.locator("#shape-library .shape-select").click();
    assert.equal(
      await page.locator("#shape-param-radius").inputValue(),
      "48",
      "A draft retained after loading B",
    );
    assert(
      await page.locator("#shape-update").isVisible(),
      "A loaded binding retained",
    );
    assert(await page.locator("#shape-update").isEnabled());
    await page.locator("#shape-back").click();
    a.selected = false;
    b.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Other",
    );
    await page.locator("#shape-library [data-collection=recent]").click();
    assert.equal(await page.locator("#shape-library .card").count(), 1);
    const savedCollections = await page.evaluate(() => localStorage.getItem("zxt-collections-v1"));
    assert(JSON.parse(savedCollections).favorites.includes("shape:glow"));
    assert(JSON.parse(savedCollections).recent.includes("shape:glow"));
    await page.reload();
    assert.equal(await page.evaluate(() => localStorage.getItem("zxt-collections-v1")), savedCollections,
      "Reload must preserve exact persisted collections; no fixture reseeding");
    await page.locator('[data-tab="Shape"]').click();
    await page.locator("#shape-library [data-collection=favorites]").click();
    assert.equal(await page.locator("#shape-library .card").count(), 1);
    assert(
      await page.evaluate(
        () =>
          ZxTCollections.isFavorite("core:counter") &&
          ZxTCollections.isFavorite("yu:1") &&
          ZxTCollections.isFavorite("core:neongrid"),
      ),
    );
    await page.locator("#shape-library [data-collection=recent]").click();
    assert.equal(await page.locator("#shape-library .card").count(), 1, "Shape Recent survives reload");
    await page.locator("#shape-library [data-collection=all]").click();
    await page.locator("#shape-library .shape-select").first().click();
    await page.keyboard.press("Escape");
    assert(await page.locator("#shape-inspector").isHidden());
    assert(await page.locator("main").isVisible());
    // All viewport tiers, including short docks. Footer never overlays primary action.
    for (const width of [300, 380, 759, 760, 920, 1200])
      for (const height of [300, 720]) {
        await page.setViewportSize({ width, height });
        await page
          .locator("#shape-family-motion")
          .evaluate((n) => (n.open = true));
        await page.locator("#shape-library .shape-select").first().click();
        assert.equal(await page.locator("main").isVisible(), width >= 760);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "page overflow " + width + "x" + height,
        );
        assert(
          await page
            .locator("#shape-inspector")
            .evaluate((n) => n.scrollWidth <= n.clientWidth),
          "Inspector overflow",
        );
        const actions = await page
            .locator("#shape-inspector .inspector-actions")
            .boundingBox(),
          footer = await page.locator("footer").boundingBox();
        if (actions.y + actions.height > footer.y + 1)
          await page.screenshot({ path: "/tmp/zxt-shape-layout-failure.png" });
        assert(
          actions.y + actions.height <= footer.y + 1,
          JSON.stringify({ width, height, actions, footer }),
        );
        if (width === 300 && height === 300)
          await page.screenshot({ path: "/tmp/zxt-shape-narrow.png" });
        if (width === 1200 && height === 720)
          await page.screenshot({ path: "/tmp/zxt-shape-wide.png" });
        await page.locator("#shape-back").click();
        assert(await page.locator("main").isVisible());
      }
    await page.locator("#toggle-search").click();
    await page.locator("#search").fill("Trim Path In");
    await page.locator("#search-results button").first().click();
    assert.equal(
      await page.locator("#shape-title").textContent(),
      "Trim Path In",
    );
    await page.locator("#shape-back").click();
    b.locked = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => ZxTSelection.context().layers[0].locked);
    await page.locator("#shape-library .shape-select").first().click();
    assert(await page.locator("#shape-apply").isDisabled());
    await page.locator("#shape-back").click();
    await page.locator('[data-tab="YU"]').click();
    assert(await page.locator("#yu").isVisible());
    assert(await page.locator("#shape-library").isHidden());
    await page.locator('[data-tab="Background"]').click();
    assert.equal(await page.locator("#cards .card").count(), 8);
    assert(await page.locator("#shape-inspector").isHidden());
    assert(!calls.some((p) => p.action === "media"), "No Media route");
    assert.deepEqual(errors, []);
    console.log(
      "PASS: Shape Library, search/categories/families, persistence, Inspector Apply/Update/load, drafts/selection, 12 viewport sizes, frozen existing tab workflow.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
