/* ============================================================
   main.js
   Ponto de entrada. Mantém o "estado" do torneio (dados) e expõe
   ações (App.start, App.pause, App.nextLevel, ...) que os botões
   do operador chamam. Também liga o motor de cronômetro (timer.js)
   à renderização (ui.js) e à persistência (storage.js).
   ============================================================ */

window.App = (() => {

  let state = null;   // dados do torneio (persistidos)
  let clock = null;   // instância de createTournamentClock
  let autosaveTimer = null;

  function freshState(overrides = {}) {
    return {
      name: '',
      date: '',
      registeredPlayers: 0,
      remainingPlayers: 0,
      activeTables: 0,
      levels: PokerClockConfig.buildDefaultLevels(),
      settings: { ...PokerClockConfig.DEFAULT_SETTINGS },
      currentLevelNumber: 1,
      isBreak: false,
      isRunning: false,
      // snapshot de tempo para restaurar após recarregar a página:
      phaseEndAt: null,          // epoch ms, se estava rodando
      remainingWhenPaused: null, // segundos, se estava pausado
      hasStarted: false,
      muted: false,
      ...overrides,
    };
  }

  function persist() {
    if (!state) return;
    // captura o instante atual do cronômetro antes de salvar
    if (clock) {
      state.isRunning = clock.isRunning();
      state.phaseEndAt = clock.isRunning() ? clock.getPhaseEndAt() : null;
      state.remainingWhenPaused = clock.isRunning() ? null : clock.getRemainingSeconds();
    }
    PokerClockStorage.save(state);
  }

  function render() {
    const remaining = clock ? clock.getRemainingSeconds() : 0;
    const running = clock ? clock.isRunning() : false;
    PokerClockUI.render(state, remaining, running);
  }

  function attachClock() {
    clock = createTournamentClock({
      onTick: () => render(),
      onWarning: (type) => {
        if (type === '5min') PokerClockAudio.playWarning5Min();
        if (type === '1min') PokerClockAudio.playWarning1Min();
      },
      onComplete: () => handlePhaseComplete(),
    });
  }

  function currentPhaseDuration() {
    const phase = PokerClockLevels.describePhase(state.levels, state.settings, state.currentLevelNumber, state.isBreak);
    return phase ? phase.durationSeconds : 0;
  }

  function handlePhaseComplete() {
    const wasBreak = state.isBreak;
    const result = PokerClockLevels.advance(state.levels, state.settings, state.currentLevelNumber, state.isBreak);

    if (result.ended) {
      // Acabou a estrutura cadastrada. Para o cronômetro e avisa —
      // o operador decide como encerrar (spec 2.6: "Encerrar torneio").
      clock.stop();
      render();
      persist();
      return;
    }

    state.currentLevelNumber = result.levelNumber;
    state.isBreak = result.isBreak;

    if (wasBreak && !state.isBreak) {
      PokerClockAudio.playBreakEnd();
    } else if (!wasBreak && state.isBreak) {
      PokerClockAudio.playBreakStart();
    } else {
      PokerClockAudio.playLevelChange();
    }

    clock.startPhase(currentPhaseDuration());
    render();
    persist();
  }

  // ---------------- Ações do operador ----------------

  function start() {
    if (!state.hasStarted) {
      state.hasStarted = true;
      PokerClockAudio.playTournamentStart();
    }
    clock.startPhase(currentPhaseDuration());
    render();
    persist();
  }

  function pauseResume() {
    if (clock.isRunning()) {
      clock.pause();
    } else {
      clock.resume();
    }
    render();
    persist();
  }

  function nextLevel() {
    const result = PokerClockLevels.advance(state.levels, state.settings, state.currentLevelNumber, state.isBreak);
    if (result.ended) return;
    state.currentLevelNumber = result.levelNumber;
    state.isBreak = result.isBreak;
    clock.startPhase(currentPhaseDuration());
    PokerClockAudio.playLevelChange();
    render();
    persist();
  }

  function prevLevel() {
    const result = PokerClockLevels.previous(state.levels, state.settings, state.currentLevelNumber, state.isBreak);
    state.currentLevelNumber = result.levelNumber;
    state.isBreak = result.isBreak;
    clock.startPhase(currentPhaseDuration());
    render();
    persist();
  }

  // Intervalo fora do previsto (ex: troca de baralho, ajuste de mesas).
  // Pausa o nível atual guardando o tempo restante, faz o intervalo,
  // e ao final retoma o MESMO nível com o tempo que faltava.
  let interruptedLevel = null;

  function startBreakManually() {
    if (state.isBreak) return;
    interruptedLevel = {
      levelNumber: state.currentLevelNumber,
      remainingSeconds: clock.getRemainingSeconds(),
    };
    state.isBreak = true;
    clock.startPhase(state.settings.breakDurationMinutes * 60);
    PokerClockAudio.playBreakStart();
    render();
    persist();
  }

  function endTournament() {
    clock.stop();
    state = freshState();
    PokerClockStorage.clear();
    PokerClockUI.showSetup();
  }

  function adjustTime(deltaSeconds) {
    clock.addSeconds(deltaSeconds);
    render();
    persist();
  }

  function changePlayerCount(field, delta) {
    state[field] = Math.max(0, (state[field] || 0) + delta);
    render();
    persist();
  }

  function toggleMute() {
    const next = !PokerClockAudio.isMuted();
    PokerClockAudio.setMuted(next);
    state.muted = next;
    render();
    persist();
  }

  function applyLevelsFromEditor() {
    const { levels, settings } = PokerClockUI.readLevelsEditor();
    state.levels = levels;
    state.settings = settings;
    render();
    persist();
  }

  function exportData() { PokerClockStorage.exportToFile(state); }

  async function importData(file) {
    const imported = await PokerClockStorage.importFromFile(file);
    loadStateObject(imported);
  }

  // ---------------- Ciclo de vida / bootstrap ----------------

  function loadStateObject(loaded) {
    state = freshState(loaded);
    attachClock();

    if (state.hasStarted) {
      if (state.isRunning && state.phaseEndAt) {
        clock.restoreRunning(state.phaseEndAt);
      } else if (state.remainingWhenPaused !== null) {
        clock.restorePaused(state.remainingWhenPaused);
      } else {
        clock.restorePaused(currentPhaseDuration());
      }
    } else {
      clock.restorePaused(currentPhaseDuration());
    }

    PokerClockAudio.setMuted(!!state.muted);
    PokerClockUI.showApp();
    render();
    startAutosave();
  }

  function createNewFromSetup(setupData) {
    state = freshState(setupData);
    attachClock();
    clock.restorePaused(currentPhaseDuration());
    PokerClockUI.showApp();
    render();
    startAutosave();
    persist();
  }

  function startAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(persist, 5000);
    window.addEventListener('beforeunload', persist);
  }

  function hasSavedTournament() {
    return !!PokerClockStorage.load();
  }

  function restoreSaved() {
    const loaded = PokerClockStorage.load();
    if (loaded) loadStateObject(loaded);
  }

  function getState() { return state; }
  function getClock() { return clock; }

  return {
    freshState, createNewFromSetup, restoreSaved, hasSavedTournament, importData,
    start, pauseResume, nextLevel, prevLevel, startBreakManually, endTournament,
    adjustTime, changePlayerCount, toggleMute, applyLevelsFromEditor, exportData,
    getState, getClock,
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  PokerClockUI.cacheElements();
  PokerClockOperator.init();

  if (App.hasSavedTournament()) {
    document.getElementById('setup-restore-hint').textContent =
      'Encontramos um torneio salvo neste dispositivo.';
  } else {
    document.getElementById('setup-restore').classList.add('hidden');
  }
});
