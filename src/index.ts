import * as Sentry from "@sentry/cloudflare";

const html = String.raw;

interface Env {
  SENTRY_DSN?: string;
  CF_VERSION_METADATA?: WorkerVersionMetadata;
}

const CAT_NORMAL = String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="Smug tabby cat head">
  <defs>
    <radialGradient id="fur" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#ffd88f"/>
      <stop offset="64%" stop-color="#f5a84f"/>
      <stop offset="100%" stop-color="#bd622e"/>
    </radialGradient>
  </defs>
  <path d="M49 83 31 25l57 32c14-4 30-4 44 0l57-32-18 58c15 15 24 35 24 57 0 43-38 68-85 68s-85-25-85-68c0-22 9-42 24-57Z" fill="url(#fur)" stroke="#332018" stroke-width="8" stroke-linejoin="round"/>
  <path d="M61 52 45 35l9 30M159 52l16-17-9 30" fill="none" stroke="#332018" stroke-width="7" stroke-linecap="round"/>
  <path d="M82 96c14-10 28-10 42 0M118 96c14-10 28-10 42 0" fill="none" stroke="#7b3f22" stroke-width="8" stroke-linecap="round"/>
  <ellipse cx="78" cy="120" rx="12" ry="15" fill="#191919"/>
  <ellipse cx="142" cy="120" rx="12" ry="15" fill="#191919"/>
  <circle cx="83" cy="114" r="4" fill="#fff"/>
  <circle cx="147" cy="114" r="4" fill="#fff"/>
  <path d="M105 141h10l-5 7Z" fill="#7b2c35"/>
  <path d="M110 148c-12 13-29 14-42 5M110 148c12 13 29 14 42 5" fill="none" stroke="#332018" stroke-width="6" stroke-linecap="round"/>
  <path d="M55 135H14M57 151H20M165 135h41M163 151h37" stroke="#332018" stroke-width="6" stroke-linecap="round"/>
  <path d="M97 62 88 89M119 57l-3 29M143 63l-10 27" stroke="#7b3f22" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const CAT_CAUGHT = String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="Caught surprised cat head">
  <path d="M49 83 31 25l57 32c14-4 30-4 44 0l57-32-18 58c15 15 24 35 24 57 0 43-38 68-85 68s-85-25-85-68c0-22 9-42 24-57Z" fill="#ffca70" stroke="#241812" stroke-width="8" stroke-linejoin="round"/>
  <path d="M61 52 45 35l9 30M159 52l16-17-9 30" fill="none" stroke="#241812" stroke-width="7" stroke-linecap="round"/>
  <path d="m72 106 21 21M93 106l-21 21M127 106l21 21M148 106l-21 21" stroke="#111" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="110" cy="154" rx="20" ry="24" fill="#4a171f"/>
  <path d="M105 136h10l-5 7Z" fill="#b93648"/>
  <path d="M55 135H14M57 151H20M165 135h41M163 151h37" stroke="#241812" stroke-width="6" stroke-linecap="round"/>
  <path d="M74 70c10 7 22 7 32 0M114 68c10 7 22 7 32 0" stroke="#b25b24" stroke-width="8" stroke-linecap="round"/>
  <text x="110" y="43" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="28" fill="#d71920" stroke="#fff" stroke-width="3">!</text>
</svg>`;

const page = html`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Catch the Cat</title>
    <style>
      :root {
        color-scheme: light;
        --chrome: #c0c0c0;
        --ink: #000;
        --blue: #0000ee;
        --visited: #551a8b;
        --hot: #ff00aa;
        --acid: #39ff14;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        overflow: hidden;
        color: var(--ink);
        font-family: "Comic Sans MS", "Trebuchet MS", Arial, sans-serif;
        background:
          linear-gradient(45deg, #008080 25%, transparent 25%) 0 0 / 32px 32px,
          linear-gradient(45deg, transparent 75%, #008080 75%) 0 0 / 32px 32px,
          linear-gradient(45deg, transparent 75%, #007070 75%) 16px 16px / 32px 32px,
          linear-gradient(45deg, #007070 25%, #00a0a0 25%) 16px 16px / 32px 32px;
        cursor: crosshair;
        user-select: none;
      }

      .marquee {
        position: fixed;
        inset: 0 0 auto;
        z-index: 3;
        border-bottom: 4px ridge #fff;
        background: #000080;
        color: #fff;
        font: 700 18px "Times New Roman", serif;
        line-height: 32px;
        white-space: nowrap;
      }

      .shell {
        position: fixed;
        top: 48px;
        left: 16px;
        z-index: 2;
        width: min(340px, calc(100vw - 32px));
        border: 4px outset #fff;
        background: var(--chrome);
        box-shadow: 8px 8px 0 #202020;
      }

      .titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 30px;
        padding: 2px 6px;
        background: linear-gradient(90deg, #000080, #1084d0);
        color: #fff;
        font: 700 16px Arial, sans-serif;
      }

      .titlebar button,
      .panel button {
        border: 3px outset #fff;
        background: var(--chrome);
        color: #000;
        font: 700 14px Arial, sans-serif;
        min-height: 32px;
      }

      .titlebar button {
        width: 28px;
        min-height: 24px;
        padding: 0;
      }

      .panel {
        display: grid;
        gap: 10px;
        padding: 12px;
      }

      h1 {
        margin: 0;
        color: #ff0;
        font: 900 30px Impact, "Arial Black", sans-serif;
        text-shadow: 2px 2px 0 #f00, 4px 4px 0 #00f;
      }

      .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font: 700 16px "Courier New", monospace;
      }

      .stat {
        padding: 8px;
        border: 3px inset #fff;
        background: #fff;
      }

      .alert {
        display: none;
        padding: 8px;
        border: 3px inset #fff;
        background: #000;
        color: #39ff14;
        font: 700 14px "Courier New", monospace;
      }

      .alert.visible {
        display: block;
      }

      .actions {
        display: grid;
        gap: 8px;
      }

      .arena {
        position: fixed;
        inset: 32px 0 0;
      }

      #cat {
        position: absolute;
        width: clamp(76px, 13vw, 132px);
        height: clamp(76px, 13vw, 132px);
        padding: 0;
        border: 0;
        background: transparent;
        transform: translate3d(42vw, 42vh, 0);
        filter: drop-shadow(8px 8px 0 rgba(0, 0, 0, 0.5));
        will-change: transform;
      }

      #cat img {
        display: block;
        width: 100%;
        height: 100%;
        image-rendering: auto;
      }

      #cat.caught {
        animation: bonk 180ms steps(2, end) infinite;
      }

      body.crashed #cat {
        filter:
          drop-shadow(10px 10px 0 rgba(255, 0, 0, 0.8))
          hue-rotate(130deg)
          saturate(2.4);
        animation: catMeltdown 110ms steps(2, end) infinite;
      }

      #dangerButton {
        position: absolute;
        z-index: 1;
        display: none;
        width: clamp(190px, 30vw, 320px);
        min-height: 92px;
        padding: 14px 24px;
        border: 8px outset #ffef66;
        border-radius: 18px;
        background:
          linear-gradient(#ff4141, #b40000 62%, #6d0000);
        color: #fff;
        font: 900 28px Impact, "Arial Black", sans-serif;
        letter-spacing: 0;
        text-shadow: 3px 3px 0 #000;
        box-shadow: 10px 12px 0 rgba(0, 0, 0, 0.55);
        transform: translate3d(50vw, 50vh, 0);
      }

      #dangerButton.visible {
        display: block;
        animation: pulseButton 650ms steps(2, end) infinite;
      }

      body.crashed {
        background:
          repeating-linear-gradient(0deg, #000 0 8px, #300 8px 16px),
          #000;
      }

      body.crashed .arena {
        animation: crashShake 90ms steps(2, end) infinite;
      }

      body.crashed #dangerButton {
        display: block;
        border-style: inset;
        background: #111;
        color: #ff4141;
        animation: none;
      }

      @keyframes bonk {
        from { rotate: -7deg; }
        to { rotate: 7deg; }
      }

      @keyframes pulseButton {
        from {
          scale: 1;
          filter: saturate(1);
        }
        to {
          scale: 1.08;
          filter: saturate(1.5);
        }
      }

      @keyframes crashShake {
        from { transform: translate(-3px, 2px); }
        to { transform: translate(3px, -2px); }
      }

      @keyframes catMeltdown {
        from {
          rotate: -18deg;
          scale: 1.1;
        }
        to {
          rotate: 18deg;
          scale: 1.28;
        }
      }

      @media (max-width: 640px) {
        .shell {
          top: 42px;
          left: 8px;
          width: calc(100vw - 16px);
        }

        h1 {
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="marquee"><marquee scrollamount="8">*** CATCH THE CAT *** BEST VIEWED WITH MAXIMUM CHAOS ***</marquee></div>
    <main class="arena" aria-label="Game arena">
      <section class="shell" aria-label="Control panel">
        <div class="titlebar">
          <span>cat.exe</span>
        </div>
        <div class="panel">
          <h1>Catch the Cat</h1>
          <div class="stats">
            <div class="stat">caught: <span id="score">0</span></div>
            <div class="stat">speed: <span id="speed">1.0</span>x</div>
          </div>
          <div id="alert" class="alert" role="alert" aria-live="assertive"></div>
          <div class="actions">
            <button type="button" id="reset">Reset</button>
          </div>
        </div>
      </section>
      <button type="button" id="cat" aria-label="Catch the cat">
        <img id="catImage" alt="Cat head" src="/cat/normal.svg" draggable="false" />
      </button>
      <button type="button" id="dangerButton" aria-label="Do not press">
        DO NOT PRESS
      </button>
    </main>
    <script>
      const cat = document.querySelector("#cat");
      const catImage = document.querySelector("#catImage");
      const shell = document.querySelector(".shell");
      const scoreEl = document.querySelector("#score");
      const speedEl = document.querySelector("#speed");
      const reset = document.querySelector("#reset");
      const dangerButton = document.querySelector("#dangerButton");
      const alertBox = document.querySelector("#alert");

      let score = 0;
      let speed = 1;
      let position = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.55 };
      let velocity = { x: 150, y: 115 };
      let last = performance.now();
      let pausedUntil = 0;
      let dangerTimer = 0;
      let meltdown = false;

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function bounds() {
        const rect = cat.getBoundingClientRect();
        return {
          minX: 0,
          minY: 32,
          maxX: window.innerWidth - rect.width,
          maxY: window.innerHeight - rect.height
        };
      }

      function render() {
        const b = bounds();
        position.x = clamp(position.x, b.minX, b.maxX);
        position.y = clamp(position.y, b.minY, b.maxY);
        cat.style.transform = "translate3d(" + position.x + "px, " + position.y + "px, 0)";
        scoreEl.textContent = String(score);
        speedEl.textContent = speed.toFixed(1);
      }

      function tick(now) {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;

        if (meltdown) {
          cat.classList.remove("caught");
          catImage.src = now % 180 < 90 ? "/cat/caught.svg" : "/cat/normal.svg";
          const b = bounds();
          position.x += velocity.x * dt;
          position.y += velocity.y * dt;

          if (position.x <= b.minX || position.x >= b.maxX) {
            velocity.x = -velocity.x * 1.04;
            position.x = clamp(position.x, b.minX, b.maxX);
          }

          if (position.y <= b.minY || position.y >= b.maxY) {
            velocity.y = -velocity.y * 1.04;
            position.y = clamp(position.y, b.minY, b.maxY);
          }

          velocity.x += (Math.random() - 0.5) * 520;
          velocity.y += (Math.random() - 0.5) * 520;
          velocity.x = clamp(velocity.x, -2200, 2200);
          velocity.y = clamp(velocity.y, -2200, 2200);
        } else if (now >= pausedUntil) {
          cat.classList.remove("caught");
          catImage.src = "/cat/normal.svg";
          const b = bounds();
          position.x += velocity.x * speed * dt;
          position.y += velocity.y * speed * dt;

          if (position.x <= b.minX || position.x >= b.maxX) {
            velocity.x *= -1;
            position.x = clamp(position.x, b.minX, b.maxX);
          }

          if (position.y <= b.minY || position.y >= b.maxY) {
            velocity.y *= -1;
            position.y = clamp(position.y, b.minY, b.maxY);
          }
        }

        render();
        requestAnimationFrame(tick);
      }

      function catchCat() {
        score += 1;
        speed = Math.min(7.5, speed + 0.35);
        velocity.x = (velocity.x > 0 ? 1 : -1) * (140 + score * 22);
        velocity.y = (velocity.y > 0 ? 1 : -1) * (110 + score * 19);
        pausedUntil = performance.now() + 520;
        cat.classList.add("caught");
        catImage.src = "/cat/caught.svg";
        render();
      }

      function triggerDemoError() {
        window.clearTimeout(dangerTimer);
        document.body.classList.add("crashed");
        alertBox.textContent = "SYSTEM ERROR: cat containment breach";
        alertBox.classList.add("visible");
        dangerButton.textContent = "YOU PRESSED IT";
        dangerButton.disabled = true;
        meltdown = true;
        pausedUntil = 0;
        velocity = {
          x: (Math.random() < 0.5 ? -1 : 1) * 1250,
          y: (Math.random() < 0.5 ? -1 : 1) * 980
        };
        fetch("/api/demo-error?code=mistle-demo", {
          headers: { "Accept": "application/json" }
        }).finally(() => {
          setTimeout(() => {
            throw new Error("MISTLE_DEMO_CLIENT_ERROR: deterministic cat fault");
          }, 350);
        });
      }

      function placeDangerButton() {
        const buttonRect = dangerButton.getBoundingClientRect();
        const shellRect = shell.getBoundingClientRect();
        const maxX = Math.max(0, window.innerWidth - buttonRect.width - 12);
        const maxY = Math.max(48, window.innerHeight - buttonRect.height - 44);
        let x = 12;
        let y = 48;

        for (let attempt = 0; attempt < 10; attempt += 1) {
          x = Math.round(12 + Math.random() * Math.max(0, maxX - 12));
          y = Math.round(48 + Math.random() * Math.max(0, maxY - 48));

          const overlapsPanel =
            x < shellRect.right + 12 &&
            x + buttonRect.width > shellRect.left - 12 &&
            y < shellRect.bottom + 12 &&
            y + buttonRect.height > shellRect.top - 12;

          if (!overlapsPanel) {
            break;
          }
        }

        dangerButton.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
      }

      function scheduleDangerButton() {
        window.clearTimeout(dangerTimer);
        dangerTimer = window.setTimeout(() => {
          placeDangerButton();
          dangerButton.classList.add("visible");
          window.setTimeout(() => {
            dangerButton.classList.remove("visible");
            scheduleDangerButton();
          }, 5000);
        }, 600 + Math.random() * 1400);
      }

      cat.addEventListener("click", catchCat);
      reset.addEventListener("click", () => {
        score = 0;
        speed = 1;
        position = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.55 };
        velocity = { x: 150, y: 115 };
        pausedUntil = 0;
        alertBox.textContent = "";
        alertBox.classList.remove("visible");
        document.body.classList.remove("crashed");
        meltdown = false;
        dangerButton.textContent = "DO NOT PRESS";
        dangerButton.disabled = false;
        dangerButton.classList.remove("visible");
        scheduleDangerButton();
        render();
      });
      dangerButton.addEventListener("click", triggerDemoError);
      window.addEventListener("resize", () => {
        render();
        if (dangerButton.classList.contains("visible")) {
          placeDangerButton();
        }
      });

      render();
      scheduleDangerButton();
      requestAnimationFrame(tick);
    </script>
  </body>
</html>`;

function svgResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}

const handler = {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/cat/normal.svg") {
      return svgResponse(CAT_NORMAL);
    }

    if (url.pathname === "/cat/caught.svg") {
      return svgResponse(CAT_CAUGHT);
    }

    if (url.pathname === "/api/demo-error") {
      if (url.searchParams.get("code") === "mistle-demo") {
        return Response.json(
          {
            ok: false,
            error: "MISTLE_DEMO_WORKER_ERROR: deterministic cat fault"
          },
          { status: 500 }
        );
      }

      return Response.json(
        { ok: false, error: "missing code" },
        { status: 400 }
      );
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(page, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    return new Response("Not found", { status: 404 });
  }
} satisfies ExportedHandler<Env>;

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: "demo"
  }),
  handler
);
