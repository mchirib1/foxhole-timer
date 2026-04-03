// ==========================
// Constants
// ==========================
const WORK_DURATION = 5 * 60 * 1000;
const REST_DURATION = 30 * 1000;

// ==========================
// Elements
// ==========================
const stateEl = document.getElementById("state");
const timeEl = document.getElementById("time");
const beep = document.getElementById("beep");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

// ==========================
// Audio Setup
// ==========================
let audioUnlocked = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function unlockAudio() {
  if (audioUnlocked) return;

  beep.play().then(() => {
    beep.pause();
    beep.currentTime = 0;
    audioUnlocked = true;
  }).catch(() => {});

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// Unlock on first interaction
document.addEventListener("click", unlockAudio);
document.addEventListener("keydown", unlockAudio);

function playFallbackBeep() {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);

  gain.gain.setValueAtTime(1, audioCtx.currentTime);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.2);
}

function playBeep() {
  if (!audioUnlocked) return;

  beep.pause();
  beep.currentTime = 0;
  beep.volume = 1.0;

  beep.play().catch(() => {
    playFallbackBeep();
  });
}

// ==========================
// Timer Logic
// ==========================
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
  stateEl.textContent = isWork ? "WORK" : "REST";
  stateEl.className = isWork ? "work" : "rest";

  playBeep();
}

// ==========================
// Initialize Timer
// ==========================
const timer = new IntervalTimer(renderTime, renderState);

// ==========================
// Input Handling
// ==========================
startBtn.addEventListener("click", () => timer.start());
pauseBtn.addEventListener("click", () => timer.pause());
resetBtn.addEventListener("click", () => timer.reset());

// D-pad navigation (important for Fire TV)
const buttons = [startBtn, pauseBtn, resetBtn];

document.addEventListener("keydown", (e) => {
  let index = buttons.indexOf(document.activeElement);

  switch (e.key) {
    case "ArrowRight":
      index = (index + 1) % buttons.length;
      buttons[index].focus();
      break;

    case "ArrowLeft":
      index = (index - 1 + buttons.length) % buttons.length;
      buttons[index].focus();
      break;

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

// ==========================
// Initial State
// ==========================
timer.reset();
startBtn.focus();