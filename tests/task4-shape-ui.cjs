const assert = require("node:assert/strict"),
  { chromium } = require("playwright"),
  { pathToFileURL } = require("node:url"),
  path = require("node:path"),
  { setup } = require("./shape-fixture.cjs");
(async () => {
  const e = setup(),
    a = e.shape(),
    b = e.shape();
  a.selected = true;
  a.name = "Shape A";
  b.name = "Shape B";
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
        p.action === "shapeLibrary" &&
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
    await page.locator('[data-tab="Shape"]').click();
    assert.equal(await page.locator("#shape-library .card").count(), 7);
    await page.locator("#shape-category").selectOption("FX");
    assert.equal(await page.locator("#shape-library .card").count(), 5);
    await page.locator("#shape-category").selectOption("all");
    await page.locator("#shape-search").fill("wiggle");
    assert.equal(await page.locator("#shape-library .card").count(), 1);
    await page.locator("#shape-search").fill("");
    await page.locator("#shape-family-fx summary").click();
    assert(await page.locator("#shape-cards-fx").isHidden());
    await page.locator("#shape-family-fx summary").click();
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    await page.locator("#shape-apply").click();
    await page.waitForFunction(
      () => !document.getElementById("shape-update").hidden
    );
    await page.locator("#shape-param-duration").fill("1.2");
    assert.equal(await page.locator("#shape-update").isDisabled(), false);
    await page.locator("#shape-update").click();
    await page.locator("#load-fx").click();
    assert.equal(
      calls.filter((p) => p.action !== "status").at(-1).action,
      "shapeLibrary"
    );
    await page.locator("#shape-param-duration").fill("1.4");
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    assert.equal(
      await page.locator("#shape-param-duration").inputValue(),
      "1.4"
    );
    a.selected = false;
    b.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape B"
    );
    assert(await page.locator("#shape-update").isDisabled());
    await page.locator("#shape-load").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-apply").hidden
    );
    await page.locator("#shape-param-duration").fill("1.3");
    await page.locator("#shape-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    assert.equal(
      await page.locator("#shape-param-duration").inputValue(),
      "1.4",
      "A draft survived B"
    );
    held = true;
    await page.locator("#shape-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    const status = e.rpc({ action: "status" });
    await page.evaluate((r) => ZxTSelection.update(r, true), status);
    release();
    await page.waitForFunction(
      () => !document.querySelector("#shape-back").disabled
    );
    assert.equal(
      await page.locator("#shape-param-duration").inputValue(),
      "1.4",
      "stale async Load ignored"
    );
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    // Native selection changes BEFORE Load executes; cached status is still A.
    a.selected = false;
    b.selected = true;
    assert.equal(
      e.rpc({
        action: "shapeLibrary",
        operation: "apply",
        id: "trim-in",
        params: { duration: 1.3 }
      }).changed,
      1
    );
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    release = null;
    delayedExecution = true;
    held = true;
    await page.locator("#shape-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#shape-back").disabled
    );
    assert.equal(
      await page.locator("#shape-param-duration").inputValue(),
      "1.4",
      "Native B response cannot overwrite cached A draft"
    );
    delayedExecution = false;
    await page.locator("#shape-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    assert.equal(
      await page.locator("#shape-param-duration").inputValue(),
      "1.4",
      "A draft survives native/cached selection lag"
    );
    // A no-instance response from B must not reset A's recognized dirty instance.
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="blur-pulse"] .shape-select').click();
    await page.locator("#shape-apply").click();
    await page.waitForFunction(
      () => !document.querySelector("#shape-update").hidden
    );
    await page.locator("#shape-param-amount").fill("55");
    release = null;
    delayedExecution = true;
    held = true;
    await page.locator("#shape-load").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#shape-back").disabled
    );
    assert(
      await page.locator("#shape-update").isVisible(),
      "B null instance cannot clear A loaded binding"
    );
    assert.equal(await page.locator("#shape-param-amount").inputValue(), "55");
    delayedExecution = false;
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    // A successful mutation on native B must be stored under B, leaving A's draft.
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="glow"] .shape-select').click();
    await page.locator("#shape-param-radius").fill("44");
    release = null;
    delayedExecution = true;
    held = true;
    holdOperation = "apply";
    await page.locator("#shape-apply").click();
    while (!release) await new Promise((r) => setTimeout(r, 5));
    a.selected = false;
    b.selected = true;
    release();
    await page.waitForFunction(
      () => !document.querySelector("#shape-back").disabled
    );
    delayedExecution = false;
    holdOperation = "load";
    await page.locator("#shape-back").click();
    b.selected = false;
    a.selected = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(
      () => ZxTSelection.context().layers[0].name === "Shape A"
    );
    await page.locator('[data-preset="glow"] .shape-select').click();
    assert(
      await page.locator("#shape-apply").isVisible(),
      "B Apply result cannot bind A's unapplied draft"
    );
    assert.equal(await page.locator("#shape-param-radius").inputValue(), "44");
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="trim-in"] .shape-select').click();
    for (const width of [300, 380, 600, 759, 760, 920, 1200])
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
            .querySelector("#shape-inspector .inspector-actions")
            .getBoundingClientRect().bottom,
          f: document.querySelector("footer").getBoundingClientRect().top
        }));
        assert(bounds.a <= bounds.f + 1, "footer overlap");
      }
    await page.setViewportSize({ width: 380, height: 720 });
    await page.locator("#shape-back").click();
    await page.locator('[data-preset="trim-in"] .favorite-toggle').click();
    const saved = await page.evaluate(() =>
      localStorage.getItem("zxt-collections-v1")
    );
    await page.reload();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("zxt-collections-v1")),
      saved
    );
    await page.locator('[data-tab="Shape"]').click();
    await page
      .locator('[data-collection-scope="Shape"] [data-collection="favorites"]')
      .click();
    assert.equal(await page.locator("#shape-library .card").count(), 2);
    await page
      .locator('[data-collection-scope="Shape"] [data-collection="recent"]')
      .click();
    assert.equal(await page.locator("#shape-library .card").count(), 3);
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
    await page.locator("#search").fill("Blur Pulse");
    await page.locator("#search-results button").first().click();
    assert.equal(
      await page.locator("#shape-title").textContent(),
      "Blur Pulse"
    );
    await page.keyboard.press("Escape");
    assert(await page.locator("#shape-inspector").isHidden());
    await page
      .locator('[data-collection-scope="Shape"] [data-collection="all"]')
      .click();
    a.locked = true;
    await page.evaluate(() => dispatchEvent(new Event("focus")));
    await page.waitForFunction(() => ZxTSelection.context().layers[0].locked);
    await page.locator('[data-preset="path-wiggle"] .shape-select').click();
    assert(await page.locator("#shape-apply").isDisabled());
    await page.locator("#shape-back").click();
    await page.locator('[data-tab="Shape"]').click();
    assert.equal(await page.locator("#shape-library .card").count(), 7);
    await page.locator('[data-tab="Background"]').click();
    assert.equal(await page.locator("#cards .card").count(), 8);
    await page.locator('[data-tab="YU"]').click();
    assert(await page.locator("#yu").isVisible());
    // Eligible Shape may lie beyond the advisory status row cap.
    const wrong = [];
    for (let i=0;i<50;i++) { const l=e.comp.add("text"); l.id=2000+i; l.selected=true; wrong.push(l); }
    a.locked=false; a.selected=true; b.selected=false; e.comp.items=[...wrong,a,b];
    await page.locator('[data-tab="Shape"]').click();
    await page.evaluate(()=>dispatchEvent(new Event("focus")));
    await page.waitForFunction(()=>ZxTSelection.context().truncated);
    await page.locator('[data-preset="path-wiggle"] .shape-select').click();
    assert(await page.locator("#shape-apply").isEnabled(),"truncated status defers authoritative Shape target safety to host");
    await page.locator("#shape-apply").click();
    await page.waitForFunction(()=>!document.getElementById("shape-back").disabled);
    assert(e.contents(a).items.some(g=>g.name.includes("path-wiggle")));
    assert.deepEqual(errors, []);
    console.log(
      "PASS Shape Inspector Apply/Update, persisted Favorites/Recent and14 viewports, including advisory truncation"
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
