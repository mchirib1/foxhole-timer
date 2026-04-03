// ==========================
// Timer Logic
// ==========================
const WORK_DURATION = 5 * 60 * 1000;
const REST_DURATION = 30 * 1000;

class IntervalTimer {
  constructor(onTick, onSwitch) {
    this.onTick = onTick;
    this.onSwitch = onSwitch;

    this.isRunning = false;
    this.isWork = true;

    this.startTime = 0;
    this.remaining = WORK_DURATION;
    this.rafId = null;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.loop();
  }

  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.remaining -= (performance.now() - this.startTime);
    cancelAnimationFrame(this.rafId);
  }

  reset() {
    this.isRunning = false;
    cancelAnimationFrame(this.rafId);

    this.isWork = true;
    this.remaining = WORK_DURATION;

    this.onSwitch(this.isWork);
    this.onTick(this.remaining);
  }

  loop() {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const timeLeft = this.remaining - elapsed;

    if (timeLeft <= 0) {
      this.switchPhase();
      return;
    }

    this.onTick(timeLeft);
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  switchPhase() {
    this.isWork = !this.isWork;
    this.remaining = this.isWork ? WORK_DURATION : REST_DURATION;

    this.startTime = performance.now();

    this.onSwitch(this.isWork);
    this.loop();
  }
}

// ==========================
// UI Rendering
// ==========================
const stateEl = document.getElementById("state");
const timeEl = document.getElementById("time");
const beep = document.getElementById("beep");

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const sec = String(totalSec % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function renderTime(ms) {
  timeEl.textContent = formatTime(ms);
}

function renderState(isWork) {
  stateEl.textContent = isWork ? "POHARRA Deez nutz Gabe" : "REST";
  stateEl.className = isWork ? "work" : "rest";

  // play beep
  beep.currentTime = 0;
  beep.play().catch(() => {});
}

// ==========================
// Input Handling (Remote)
// ==========================
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

const timer = new IntervalTimer(renderTime, renderState);

// Button clicks
startBtn.addEventListener("click", () => timer.start());
pauseBtn.addEventListener("click", () => timer.pause());
resetBtn.addEventListener("click", () => timer.reset());

// Remote / keyboard support
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "Enter":
      document.activeElement.click();
      break;

    case "MediaPlayPause":
      timer.isRunning ? timer.pause() : timer.start();
      break;

    case "r":
    case "R":
      timer.reset();
      break;
  }
});

// Initial render
timer.reset();
startBtn.focus();