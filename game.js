const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const MAX_HP = 120;
const MAX_TP = 20;

const enemyNames = [
  { name: "RUINMAW", title: "MOSS-BOUND PREDATOR" },
  { name: "GEARFANG", title: "RUSTED HUNTER" },
  { name: "EPOCH HOUND", title: "TEMPORAL ANOMALY" },
  { name: "CROWNED RUINMAW", title: "WILDGEAR ALPHA" },
];

const state = {
  heroHp: MAX_HP,
  heroTp: MAX_TP,
  enemyHp: 150,
  enemyMaxHp: 150,
  tonics: 2,
  wins: 0,
  round: 1,
  encounter: 1,
  guard: false,
  locked: false,
  over: false,
  sound: true,
  battleToken: 0,
};

const els = {
  battleStage: $("#battleStage"),
  hero: $("#heroCombatant"),
  enemy: $("#enemyCombatant"),
  heroHp: $("#heroHp"),
  heroTp: $("#heroTp"),
  heroHpBar: $("#heroHpBar"),
  heroTpBar: $("#heroTpBar"),
  enemyHp: $("#enemyHp"),
  enemyMaxHp: $("#enemyMaxHp"),
  enemyHpBar: $("#enemyHpBar"),
  enemyName: $("#enemyName"),
  enemyLevel: $("#enemyLevel"),
  enemyState: $("#enemyState"),
  turnChip: $("#turnChip"),
  turnText: $("#turnText"),
  battleMessage: $("#battleMessage"),
  roundLabel: $("#roundLabel"),
  tonicCount: $("#tonicCount"),
  winCount: $("#winCount"),
  heroLevel: $("#heroLevel"),
  mainCommands: $("#mainCommands"),
  artsCommands: $("#artsCommands"),
  callout: $("#battleCallout"),
  fxLayer: $("#fxLayer"),
  resultScreen: $("#resultScreen"),
  resultKicker: $("#resultKicker"),
  resultTitle: $("#resultTitle"),
  resultCopy: $("#resultCopy"),
  resultStats: $("#resultStats"),
  resultButton: $("#resultButton"),
  soundToggle: $("#soundToggle"),
  soundLabel: $("#soundLabel"),
};

let audioContext;
let masterGain;
let musicGain;
let effectsGain;
let noiseBuffer;
let musicTimer;
let musicStep = 0;
let nextMusicNote = 0;

const musicMelody = [
  659, null, 784, 880, 988, null, 880, 784,
  587, null, 659, 784, 880, null, 784, 659,
  523, null, 659, 784, 880, null, 988, 880,
  494, null, 587, 659, 784, null, 659, 587,
];

const musicBass = [110, 98, 87.31, 98];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validToken(token) {
  return token === state.battleToken;
}

function ensureAudio() {
  if (!state.sound) return null;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return null;

  if (!audioContext) {
    audioContext = new AudioEngine();
    masterGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    effectsGain = audioContext.createGain();
    masterGain.gain.value = 0.72;
    musicGain.gain.value = 0.0001;
    effectsGain.gain.value = 0.82;
    musicGain.connect(masterGain);
    effectsGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(
  frequency,
  duration = 0.08,
  type = "square",
  volume = 0.035,
  delay = 0,
  destination = effectsGain,
  glideTo = null,
) {
  const context = ensureAudio();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.012, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination || effectsGain);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function getNoiseBuffer() {
  const context = ensureAudio();
  if (!context) return null;
  if (noiseBuffer) return noiseBuffer;

  noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.3), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function noiseBurst(duration = 0.08, volume = 0.06, filterFrequency = 1500, delay = 0) {
  const context = ensureAudio();
  const buffer = getNoiseBuffer();
  if (!context || !buffer) return;

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFrequency, start);
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(effectsGain);
  source.start(start);
  source.stop(start + duration);
}

function scheduleMusic() {
  if (!audioContext || !musicTimer || audioContext.state !== "running") return;
  const stepLength = 0.22;

  while (nextMusicNote < audioContext.currentTime + 0.3) {
    const melody = musicMelody[musicStep % musicMelody.length];
    const delay = Math.max(0, nextMusicNote - audioContext.currentTime);
    if (melody) tone(melody, 0.16, "square", 0.026, delay, musicGain);

    if (musicStep % 4 === 0) {
      const bass = musicBass[Math.floor(musicStep / 8) % musicBass.length];
      tone(bass, 0.38, "triangle", 0.06, delay, musicGain);
    }

    if (musicStep % 2 === 0) {
      tone(1760, 0.025, "square", 0.007, delay, musicGain);
    }

    nextMusicNote += stepLength;
    musicStep += 1;
  }
}

function startMusic() {
  const context = ensureAudio();
  if (!context || musicTimer) return;
  musicGain.gain.cancelScheduledValues(context.currentTime);
  musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), context.currentTime);
  musicGain.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.35);
  musicStep = 0;
  nextMusicNote = context.currentTime + 0.04;
  musicTimer = window.setInterval(scheduleMusic, 80);
  scheduleMusic();
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
  if (!audioContext || !musicGain) return;
  musicGain.gain.cancelScheduledValues(audioContext.currentTime);
  musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), audioContext.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);
}

function sound(kind) {
  if (!state.sound) return;
  if (!ensureAudio()) return;
  startMusic();
  if (kind === "select") tone(460, 0.05, "square", 0.025);
  if (kind === "attack") {
    noiseBurst(0.11, 0.075, 3200);
    tone(920, 0.14, "sawtooth", 0.055, 0, effectsGain, 130);
    tone(240, 0.1, "triangle", 0.025, 0.045, effectsGain, 90);
  }
  if (kind === "collision") {
    noiseBurst(0.13, 0.12, 620);
    tone(105, 0.16, "square", 0.085, 0, effectsGain, 48);
    tone(54, 0.2, "triangle", 0.06, 0.015);
  }
  if (kind === "heal") {
    tone(440, 0.18, "sine", 0.03);
    tone(660, 0.22, "sine", 0.025, 0.08);
  }
  if (kind === "victory") {
    [523, 659, 784, 1047].forEach((note, index) => tone(note, 0.32, "square", 0.025, index * 0.1));
  }
  if (kind === "defeat") {
    [220, 185, 147].forEach((note, index) => tone(note, 0.45, "triangle", 0.035, index * 0.16));
  }
}

function updateUI() {
  const heroHpPercent = Math.max(0, (state.heroHp / MAX_HP) * 100);
  const heroTpPercent = Math.max(0, (state.heroTp / MAX_TP) * 100);
  const enemyHpPercent = Math.max(0, (state.enemyHp / state.enemyMaxHp) * 100);

  els.heroHp.textContent = state.heroHp;
  els.heroTp.textContent = state.heroTp;
  els.enemyHp.textContent = Math.max(0, state.enemyHp);
  els.enemyMaxHp.textContent = state.enemyMaxHp;
  els.tonicCount.textContent = state.tonics;
  els.winCount.textContent = String(state.wins).padStart(2, "0");
  els.roundLabel.textContent = `ROUND ${String(state.round).padStart(2, "0")}`;

  els.heroHpBar.style.width = `${heroHpPercent}%`;
  els.heroTpBar.style.width = `${heroTpPercent}%`;
  els.enemyHpBar.style.width = `${enemyHpPercent}%`;
  els.heroHpBar.style.background = heroHpPercent <= 25
    ? "linear-gradient(90deg, #a92f37, #f15e55)"
    : "var(--hp)";

  $$('[data-art]').forEach((button) => {
    button.disabled = state.locked || state.heroTp < Number(button.dataset.cost);
  });

  $$('[data-action]').forEach((button) => {
    button.disabled = state.locked || state.over;
  });

  const itemButton = $('[data-action="item"]');
  if (itemButton) itemButton.disabled = state.locked || state.over || state.tonics <= 0 || state.heroHp >= MAX_HP;
}

function setTurn(label, enemy = false) {
  els.turnText.textContent = label;
  els.turnChip.classList.toggle("enemy-turn", enemy);
}

function setMessage(message) {
  els.battleMessage.textContent = message;
}

function setLocked(locked) {
  state.locked = locked;
  updateUI();
}

function showMainCommands() {
  els.artsCommands.hidden = true;
  els.mainCommands.hidden = false;
  updateUI();
}

function showArts() {
  if (state.locked || state.over) return;
  els.mainCommands.hidden = true;
  els.artsCommands.hidden = false;
  setMessage("Choose a temporal art.");
  const firstAvailable = $$('[data-art]').find((button) => !button.disabled);
  firstAvailable?.focus();
}

function callout(text) {
  els.callout.textContent = text;
  els.callout.classList.remove("show");
  void els.callout.offsetWidth;
  els.callout.classList.add("show");
}

function spawnDamage(amount, target, heal = false) {
  const targetRect = target.getBoundingClientRect();
  const stageRect = els.battleStage.getBoundingClientRect();
  const number = document.createElement("span");
  number.className = `damage-number${heal ? " heal" : ""}`;
  number.textContent = heal ? `+${amount}` : `−${amount}`;
  number.style.left = `${targetRect.left - stageRect.left + targetRect.width / 2}px`;
  number.style.top = `${targetRect.top - stageRect.top + targetRect.height * 0.33}px`;
  els.fxLayer.append(number);
  number.addEventListener("animationend", () => number.remove(), { once: true });
}

function spawnSparks(target, color = "#f0bc69", count = 14) {
  const targetRect = target.getBoundingClientRect();
  const stageRect = els.battleStage.getBoundingClientRect();
  const centerX = targetRect.left - stageRect.left + targetRect.width / 2;
  const centerY = targetRect.top - stageRect.top + targetRect.height * 0.46;

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement("i");
    spark.className = "spark-particle";
    spark.style.left = `${centerX + randomInt(-25, 25)}px`;
    spark.style.top = `${centerY + randomInt(-22, 22)}px`;
    spark.style.background = color;
    spark.style.boxShadow = `0 0 10px ${color}`;
    spark.style.setProperty("--dx", `${randomInt(-85, 85)}px`);
    spark.style.setProperty("--dy", `${randomInt(-100, 35)}px`);
    els.fxLayer.append(spark);
    spark.addEventListener("animationend", () => spark.remove(), { once: true });
  }
}

function hitEffect(target, amount, heal = false, color) {
  spawnDamage(amount, target, heal);
  spawnSparks(target, color || (heal ? "#79f0bd" : "#f0bc69"), heal ? 18 : 14);
  if (!heal) {
    target.classList.add("hit");
    els.battleStage.classList.add("shake");
    setTimeout(() => target.classList.remove("hit"), 460);
    setTimeout(() => els.battleStage.classList.remove("shake"), 360);
    sound("collision");
  }
}

async function animateAttack(attacker, target, damage, color) {
  attacker.classList.remove("idle");
  attacker.classList.add("attacking");
  sound("attack");
  await wait(330);
  hitEffect(target, damage, false, color);
  await wait(340);
  attacker.classList.remove("attacking");
  attacker.classList.add("idle");
}

async function playerAttack() {
  if (state.locked || state.over) return;
  const token = state.battleToken;
  setLocked(true);
  setTurn("Lyra acts");
  callout("Attack!");
  setMessage("Lyra darts across the moonlit grass.");

  const damage = randomInt(19, 28) + Math.floor(state.wins / 2);
  await animateAttack(els.hero, els.enemy, damage);
  if (!validToken(token)) return;

  state.enemyHp = Math.max(0, state.enemyHp - damage);
  state.heroTp = Math.min(MAX_TP, state.heroTp + 2);
  updateUI();
  setMessage(`Lyra strikes for ${damage} damage and recovers 2 TP.`);

  if (state.enemyHp <= 0) {
    await victory(token);
    return;
  }

  await wait(650);
  if (validToken(token)) await enemyTurn(token);
}

async function useArt(artName) {
  if (state.locked || state.over) return;
  const arts = {
    arcSlash: { name: "Arc Slash", cost: 6, min: 33, max: 43, color: "#ffb85f" },
    sparkLance: { name: "Spark Lance", cost: 10, min: 47, max: 58, color: "#8ff4ff" },
    timeMend: { name: "Time Mend", cost: 8, heal: true, min: 34, max: 45, color: "#79f0bd" },
  };
  const art = arts[artName];
  if (!art || state.heroTp < art.cost) return;

  const token = state.battleToken;
  state.heroTp -= art.cost;
  setLocked(true);
  showMainCommands();
  setTurn("Lyra channels");
  callout(`${art.name}!`);
  updateUI();

  if (art.heal) {
    const before = state.heroHp;
    state.heroHp = Math.min(MAX_HP, state.heroHp + randomInt(art.min, art.max));
    const restored = state.heroHp - before;
    setMessage("Time folds around Lyra's wounds.");
    sound("heal");
    hitEffect(els.hero, restored, true, art.color);
    updateUI();
    await wait(900);
    if (validToken(token)) await enemyTurn(token);
    return;
  }

  const damage = randomInt(art.min, art.max) + state.wins;
  setMessage(`${art.name} tears through the wildgear's defenses.`);
  await animateAttack(els.hero, els.enemy, damage, art.color);
  if (!validToken(token)) return;

  state.enemyHp = Math.max(0, state.enemyHp - damage);
  updateUI();

  if (state.enemyHp <= 0) {
    await victory(token);
    return;
  }

  const disrupted = artName === "sparkLance" && Math.random() < 0.35;
  if (disrupted) {
    els.enemyState.textContent = "DISRUPTED";
    setMessage(`Spark Lance deals ${damage} damage—the Ruinmaw loses its turn!`);
    await wait(900);
    if (validToken(token)) beginPlayerTurn();
  } else {
    setMessage(`${art.name} deals ${damage} damage.`);
    await wait(650);
    if (validToken(token)) await enemyTurn(token);
  }
}

async function guard() {
  if (state.locked || state.over) return;
  const token = state.battleToken;
  state.guard = true;
  state.heroTp = Math.min(MAX_TP, state.heroTp + 4);
  setLocked(true);
  setTurn("Guard stance");
  callout("Guard!");
  setMessage("Lyra braces behind her saber and recovers 4 TP.");
  spawnSparks(els.hero, "#a8f7ef", 10);
  tone(260, 0.2, "triangle", 0.03);
  updateUI();
  await wait(650);
  if (validToken(token)) await enemyTurn(token);
}

async function useItem() {
  if (state.locked || state.over || state.tonics <= 0 || state.heroHp >= MAX_HP) return;
  const token = state.battleToken;
  const before = state.heroHp;
  state.heroHp = Math.min(MAX_HP, state.heroHp + 50);
  const restored = state.heroHp - before;
  state.tonics -= 1;
  setLocked(true);
  setTurn("Using item");
  callout("Moon Tonic!");
  setMessage(`The tonic restores ${restored} HP.`);
  sound("heal");
  hitEffect(els.hero, restored, true);
  updateUI();
  await wait(850);
  if (validToken(token)) await enemyTurn(token);
}

async function enemyTurn(token) {
  if (!validToken(token) || state.over) return;
  setTurn("Enemy turn", true);
  els.enemyState.textContent = state.enemyHp / state.enemyMaxHp < 0.3 ? "ENRAGED" : "HOSTILE";
  setMessage("The Ruinmaw's amber core flares.");
  await wait(450);
  if (!validToken(token)) return;

  const lowHealth = state.enemyHp / state.enemyMaxHp < 0.3;
  const heavyAttack = Math.random() < (lowHealth ? 0.38 : 0.2);
  const min = 15 + state.encounter * 2 + (heavyAttack ? 5 : 0);
  const max = 22 + state.encounter * 2 + (heavyAttack ? 8 : 0);
  let damage = randomInt(min, max);
  const move = heavyAttack ? "Epoch Rend" : "Gearfang";

  callout(`${move}!`);
  setMessage(heavyAttack ? "The beast tears open a seam in time!" : "Stone claws rake through the clearing.");
  if (state.guard) damage = Math.max(1, Math.round(damage * 0.35));

  await animateAttack(els.enemy, els.hero, damage, heavyAttack ? "#76eff5" : "#ef9f58");
  if (!validToken(token)) return;

  state.heroHp = Math.max(0, state.heroHp - damage);
  updateUI();
  setMessage(state.guard
    ? `Guard softens ${move} to ${damage} damage.`
    : `${move} deals ${damage} damage.`);
  state.guard = false;

  if (state.heroHp <= 0) {
    await defeat(token);
    return;
  }

  await wait(650);
  if (!validToken(token)) return;
  state.round += 1;
  beginPlayerTurn();
}

function beginPlayerTurn() {
  state.locked = false;
  els.enemyState.textContent = state.enemyHp / state.enemyMaxHp < 0.3 ? "ENRAGED" : "HOSTILE";
  setTurn("Your turn");
  setMessage("Choose Lyra's next move.");
  showMainCommands();
  updateUI();
}

async function victory(token) {
  if (!validToken(token)) return;
  state.over = true;
  state.locked = true;
  state.enemyHp = 0;
  state.wins += 1;
  els.enemyState.textContent = "DEFEATED";
  setTurn("Victory");
  setMessage("The wildgear's core dims to a quiet ember.");
  els.enemy.classList.remove("idle");
  els.enemy.classList.add("defeated");
  updateUI();
  sound("victory");
  await wait(950);
  if (!validToken(token)) return;
  showResult(true);
}

async function defeat(token) {
  if (!validToken(token)) return;
  state.over = true;
  state.locked = true;
  setTurn("Defeat", true);
  setMessage("Lyra falls—but the echo can be rewritten.");
  els.hero.classList.remove("idle");
  els.hero.classList.add("defeated");
  updateUI();
  sound("defeat");
  await wait(950);
  if (!validToken(token)) return;
  showResult(false);
}

function showResult(won) {
  els.resultScreen.hidden = false;
  if (won) {
    els.resultKicker.textContent = "Timeline secured";
    els.resultTitle.textContent = "Victory!";
    els.resultCopy.textContent = "The wildgear falls silent. Something fiercer stirs beyond the ruins.";
    els.resultStats.innerHTML = `
      <div class="result-stat"><span>Rounds</span><strong>${state.round}</strong></div>
      <div class="result-stat"><span>HP left</span><strong>${state.heroHp}</strong></div>
      <div class="result-stat"><span>Wins</span><strong>${state.wins}</strong></div>
    `;
    els.resultButton.innerHTML = `Venture onward <span aria-hidden="true">→</span>`;
  } else {
    els.resultKicker.textContent = "Timeline fractured";
    els.resultTitle.textContent = "Defeat";
    els.resultCopy.textContent = "The ruins claim this echo. Turn back the clock and choose another path.";
    els.resultStats.innerHTML = `
      <div class="result-stat"><span>Reached</span><strong>LV ${state.encounter}</strong></div>
      <div class="result-stat"><span>Rounds</span><strong>${state.round}</strong></div>
      <div class="result-stat"><span>Wins</span><strong>${state.wins}</strong></div>
    `;
    els.resultButton.innerHTML = `Rewrite the battle <span aria-hidden="true">↻</span>`;
  }
  els.resultButton.dataset.won = String(won);
  setTimeout(() => els.resultButton.focus(), 100);
}

function startBattle(advance = false) {
  state.battleToken += 1;
  if (advance) state.encounter += 1;
  state.heroHp = MAX_HP;
  state.heroTp = MAX_TP;
  state.tonics = 2;
  state.round = 1;
  state.guard = false;
  state.locked = false;
  state.over = false;
  state.enemyMaxHp = 140 + state.encounter * 14;
  state.enemyHp = state.enemyMaxHp;

  const enemy = enemyNames[(state.encounter - 1) % enemyNames.length];
  els.enemyName.textContent = enemy.name;
  els.enemyLevel.textContent = `LV ${state.encounter}`;
  els.enemyState.textContent = "HOSTILE";
  els.heroLevel.textContent = `LV ${8 + Math.floor(state.wins / 2)}`;
  els.resultScreen.hidden = true;
  els.hero.className = "combatant hero-combatant idle";
  els.enemy.className = "combatant enemy-combatant idle";
  els.enemy.style.filter = `drop-shadow(0 16px 12px rgba(0, 0, 0, 0.55)) hue-rotate(${(state.encounter - 1) * 12}deg)`;
  showMainCommands();
  setTurn("Your turn");
  setMessage(`${enemy.title}: ${enemy.name} blocks the moonlit path.`);
  callout(`Encounter ${state.encounter}`);
  updateUI();
}

function handleAction(action) {
  sound("select");
  if (action === "attack") playerAttack();
  if (action === "arts") showArts();
  if (action === "guard") guard();
  if (action === "item") useItem();
  if (action === "back") {
    showMainCommands();
    setMessage("Choose Lyra's next move.");
  }
}

$$('[data-action]').forEach((button) => {
  button.addEventListener("click", () => handleAction(button.dataset.action));
});

$$('[data-art]').forEach((button) => {
  button.addEventListener("click", () => {
    sound("select");
    useArt(button.dataset.art);
  });
});

els.resultButton.addEventListener("click", () => {
  sound("select");
  const won = els.resultButton.dataset.won === "true";
  startBattle(won);
});

els.soundToggle.addEventListener("click", () => {
  state.sound = !state.sound;
  els.soundToggle.setAttribute("aria-pressed", String(state.sound));
  els.soundLabel.textContent = state.sound ? "Sound on" : "Sound off";
  els.soundToggle.firstElementChild.textContent = state.sound ? "♪" : "×";
  if (state.sound) {
    if (audioContext && effectsGain) {
      effectsGain.gain.cancelScheduledValues(audioContext.currentTime);
      effectsGain.gain.setValueAtTime(0.82, audioContext.currentTime);
    }
    sound("select");
  } else {
    stopMusic();
    if (audioContext && effectsGain) {
      effectsGain.gain.cancelScheduledValues(audioContext.currentTime);
      effectsGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    }
  }
});

document.addEventListener("visibilitychange", () => {
  if (!audioContext) return;
  if (document.hidden) {
    stopMusic();
    audioContext.suspend();
  } else if (state.sound) {
    audioContext.resume().then(startMusic);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.repeat || state.over) return;
  const key = event.key.toLowerCase();
  if (!els.artsCommands.hidden && event.key === "Escape") {
    event.preventDefault();
    handleAction("back");
    return;
  }
  if (state.locked || !els.artsCommands.hidden) return;
  const shortcuts = { a: "attack", s: "arts", d: "guard", f: "item" };
  if (shortcuts[key]) {
    event.preventDefault();
    const button = $(`[data-action="${shortcuts[key]}"]`);
    if (!button?.disabled) handleAction(shortcuts[key]);
  }
});

startBattle(false);
