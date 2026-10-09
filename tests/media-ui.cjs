const assert = require("node:assert/strict"),
  { chromium } = require("playwright"),
  { pathToFileURL } = require("node:url"),
  path = require("node:path"),
  { setup } = require("./media-fixture.cjs");
(async () => {
  const e = setup(),
    a = e.media(),
    b = e.media("precomp");
  a.selected = true;
  a.name = "Media A";
  b.name = "Media B";
  let held = false,
    holdOperation = "load",
    delayedExecution = false,
    release;
  const calls = [];
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--no-sandbox"]
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 380, height: 720 }
      }),
      errors = [];
    page.on("pageerror", (x) => errors.push(x.message));
    await page.exposeFunction("hostRpc", (p) => {
      calls.push(p);
      if (
        held &&
        p.action === "mediaLibrary" &&
        p.operation === holdOperation
      ) {
        held = false;
        const r = delayedExecution ? null : e.rpc(p);
        return new Promise(
          (resolve) =>
            (release = () => resolve(delayedExecution ? e.rpc(p) : r))
        );
      }
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
        }
      };
      Object.defineProperty(window, "MotionAstraBridge", {
        get: () => bridge,
        set() {}
      });
    });
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    await page.evaluate(() =>
      localStorage.setItem(
        "zxt-collections-v1",
        JSON.stringify({
          favorites: [
            "core:counter",
            "yu:1",
            "core:neongrid",
            "shape:glow",
            "create:text",
            "create:shape",
            "create:solid"
          ],
          recent: ["core:counter", "shape:trim-in", "create:solid"]
        })
      )
    );
    await page.reload();
    await page.locator('[data-tab="Media"]').click();
    assert.equal(await page.locator("#media-library .card").count(), 4);
    await page.locator("#media-category").selectOption("FX");
    assert.equal(await page.locator("#media-library .card").count(), 2);
    await page.locator("#media-category").selectOption("all");
    await page.locator("#media-search").fill("pop");
    assert.equal(await page.locator("#media-library .card").count(), 1);
    await page.locator("#media-search").fill("");
    await page.locator("#media-family-fx summary").click();
    assert(await page.locator("#media-cards-fx").isHidden());
    await page.locator("#media-family-fx summary").click();
    await page.locator('[data-preset="slide-up"] .media-select').click();
    await page.locator("#media-apply").click();
    await page.waitForFunction(
      () => !document.getElementById("media-update").hidden
    );
    await page.locator("#media-param-distance").fill("200");
    assert.equal(await page.locator("#media-update").isDisabled(), false);
    await page.locator("#media-update").click();
    await page.locator("#load-fx").click();
    assert.equal(
      calls.filter((p) => p.action !== "status").at(-1).action,
      "mediaLibrary"
    );
    await page.locator("#media-param-distance").fill("222");
    await page.locator("#media-back").click();
    await page.locator('[data-preset="slide-up"] .media-select').click();
    assert.equal(
      await page.locator("#media-param-distance").inputValue(),
      "222"
    );
    a.selected = false;
    b.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media B"
    );
    assert(await page.locator("#media-update").isDisabled());
    await page.locator("#media-load").click();
    await page.waitForFunction(
      () => !document.querySelector("#media-apply").hidden
    );
    await page.locator("#media-param-distance").fill("333");
    await page.locator("#media-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    await page.locator('[data-preset="slide-up"] .media-select').click();
    assert.equal(
      await page.locator("#media-param-distance").inputValue(),
      "222",
      "A draft survived B"
    );
    held = true;
    await page.locator("#media-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    const status = e.rpc({ action: "status" });
    await page.evaluate((r) => ZxTSelection.update(r, true), status);
    release();
    await page.waitForFunction(
      () => !document.querySelector("#media-back").disabled
    );
    assert.equal(
      await page.locator("#media-param-distance").inputValue(),
      "222",
      "stale async Load ignored"
    );
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    // Native selection changes BEFORE Load executes; cached status is still A.
    a.selected = false;
    b.selected = true;
    assert.equal(
      e.rpc({
        action: "mediaLibrary",
        operation: "apply",
        id: "slide-up",
        params: { distance: 333 }
      }).changed,
      1
    );
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    release = null;
    delayedExecution = true;
    held = true;
    await page.locator("#media-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#media-back").disabled
    );
    assert.equal(
      await page.locator("#media-param-distance").inputValue(),
      "222",
      "Native B response cannot overwrite cached A draft"
    );
    delayedExecution = false;
    await page.locator("#media-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    await page.locator('[data-preset="slide-up"] .media-select').click();
    assert.equal(
      await page.locator("#media-param-distance").inputValue(),
      "222",
      "A draft survives native/cached selection lag"
    );
    // A no-instance response from B must not reset A's recognized dirty instance.
    await page.locator("#media-back").click();
    await page.locator('[data-preset="blur-reveal"] .media-select').click();
    await page.locator("#media-apply").click();
    await page.waitForFunction(
      () => !document.querySelector("#media-update").hidden
    );
    await page.locator("#media-param-amount").fill("55");
    release = null;
    delayedExecution = true;
    held = true;
    await page.locator("#media-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#media-back").disabled
    );
    assert(
      await page.locator("#media-update").isVisible(),
      "B null instance cannot clear A loaded binding"
    );
    assert.equal(await page.locator("#media-param-amount").inputValue(), "55");
    delayedExecution = false;
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    await page.locator("#media-back").click();
    await page.locator('[data-preset="slide-up"] .media-select').click();
    // A successful mutation on native B must be stored under B, leaving A's draft.
    await page.locator("#media-back").click();
    await page.locator('[data-preset="rgb-split"] .media-select').click();
    await page.locator("#media-param-amount").fill("44");
    release = null;
    delayedExecution = true;
    held = true;
    holdOperation = "apply";
    await page.locator("#media-apply").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#media-back").disabled
    );
    delayedExecution = false;
    holdOperation = "load";
    await page.locator("#media-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Media A"
    );
    await page.locator('[data-preset="rgb-split"] .media-select').click();
    assert(
      await page.locator("#media-apply").isVisible(),
      "B Apply result cannot bind A's unapplied draft"
    );
    assert.equal(await page.locator("#media-param-amount").inputValue(), "44");
    await page.locator("#media-back").click();
    await page.locator('[data-preset="slide-up"] .media-select').click();
    for (const width of [300, 380, 759, 760, 920, 1200])
      for (const height of [300, 720]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.locator("main").isVisible(), width >= 760);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          "overflow " + width + "x" + height
        );
        const bounds = await page.evaluate(() => ({
          a: document
            .querySelector("#media-inspector .inspector-actions")
            .getBoundingClientRect().bottom,
          f: document.querySelector("footer").getBoundingClientRect().top
        }));
        assert(bounds.a <= bounds.f + 1, "footer overlap");
      }
    await page.setViewportSize({ width: 380, height: 720 });
    await page.locator("#media-back").click();
    await page.locator('[data-preset="slide-up"] .favorite-toggle').click();
    const saved = await page.evaluate(() =>
      localStorage.getItem("zxt-collections-v1")
    );
    await page.reload();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("zxt-collections-v1")),
      saved
    );
    await page.locator('[data-tab="Media"]').click();
    await page
      .locator('[data-collection-scope="Media"] [data-collection="favorites"]')
      .click();
    assert.equal(await page.locator("#media-library .card").count(), 1);
    await page
      .locator('[data-collection-scope="Media"] [data-collection="recent"]')
      .click();
    assert.equal(await page.locator("#media-library .card").count(), 3);
    assert(
      await page.evaluate(() =>
        [
          "core:counter",
          "yu:1",
          "core:neongrid",
          "shape:glow",
          "create:text",
          "create:shape",
          "create:solid"
        ].every((k) => ZxTCollections.isFavorite(k))
      )
    );
    await page.locator("#toggle-search").click();
    await page.locator("#search").fill("Blur Reveal");
    await page.locator("#search-results button").first().click();
    assert.equal(
      await page.locator("#media-title").textContent(),
      "Blur Reveal"
    );
    await page.keyboard.press("Escape");
    assert(await page.locator("#media-inspector").isHidden());
    await page
      .locator('[data-collection-scope="Media"] [data-collection="all"]')
      .click();
    a.locked = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => ZxTSelection.context().layers[0].locked);
    await page.locator('[data-preset="pop-in"] .media-select').click();
    assert(await page.locator("#media-apply").isDisabled());
    await page.locator("#media-back").click();
    await page.locator('[data-tab="Shape"]').click();
    assert.equal(await page.locator("#shape-library .card").count(), 4);
    await page.locator('[data-tab="Background"]').click();
    assert.equal(await page.locator("#cards .card").count(), 8);
    await page.locator('[data-tab="YU"]').click();
    assert(await page.locator("#yu").isVisible());
    // Status only returns 50 rows; a later eligible Media target must remain usable.
    const wrong = [];
    for (let i = 0; i < 50; i++) {
      const l = e.comp.add("text");
      l.id = 2000 + i;
      l.selected = true;
      wrong.push(l);
    }
    a.locked = false;
    a.selected = true;
    b.selected = false;
    e.comp.items = [...wrong, a, b];
    await page.locator('[data-tab="Media"]').click();
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => ZxTSelection.context().truncated);
    await page.locator('[data-preset="pop-in"] .media-select').click();
    assert(
      await page.locator("#media-apply").isEnabled(),
      "truncated status defers eligibility to full host selection"
    );
    await page.locator("#media-apply").click();
    await page.waitForFunction(
      () => !document.querySelector("#media-back").disabled
    );
    assert(
      e.rpc({ action: "mediaLibrary", operation: "inspect" }).layers.at(-1)
        .eligible
    );
    assert(
      a.fx.items.some((g) => g.name.includes("pop-in")),
      "eligible target beyond status cap receives Apply"
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS Media Inspector Apply/Update, persisted Favorites/Recent and 12 viewports"
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
