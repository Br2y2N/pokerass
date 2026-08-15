/* ============================================================
   timer.js
   Motor de contagem regressiva.

   Decisão de projeto importante: o tempo restante NUNCA é
   guardado como "vou subtraindo 1 a cada segundo". Isso derrapa
   quando a aba fica em segundo plano (o navegador desacelera
   o setInterval) e quebra a precisão de ±1s exigida na spec.

   Em vez disso guardamos o horário absoluto em que a fase atual
   deve terminar (phaseEndAt, epoch em ms) e, a cada tick,
   calculamos: restante = phaseEndAt - agora. Isso também permite
   recarregar a página no meio de um nível sem perder o tempo real.
   ============================================================ */

window.createTournamentClock = function({ onTick, onWarning, onComplete }) {

  let phaseEndAt = null;      // epoch ms em que a fase termina (null = parado)
  let remainingWhenPaused = null; // segundos restantes, quando pausado
  let running = false;
  let intervalId = null;
  let warnedFlags = new Set(); // evita repetir o mesmo aviso sonoro na mesma fase

  function clearWarnings() { warnedFlags = new Set(); }

  function startPhase(durationSeconds) {
    clearWarnings();
    phaseEndAt = Date.now() + durationSeconds * 1000;
    remainingWhenPaused = null;
    running = true;
    tick();
  }

  function pause() {
    if (!running) return;
    remainingWhenPaused = getRemainingSeconds();
    phaseEndAt = null;
    running = false;
    tick();
  }

  function resume() {
    if (running || remainingWhenPaused === null) return;
    phaseEndAt = Date.now() + remainingWhenPaused * 1000;
    remainingWhenPaused = null;
    running = true;
    tick();
  }

  function stop() {
    phaseEndAt = null;
    remainingWhenPaused = null;
    running = false;
  }

  // Ajuste manual (+/- minutos), usado no ajuste fino do operador.
  function addSeconds(delta) {
    if (running && phaseEndAt !== null) {
      phaseEndAt += delta * 1000;
    } else if (remainingWhenPaused !== null) {
      remainingWhenPaused = Math.max(0, remainingWhenPaused + delta);
    }
    tick();
  }

  function getRemainingSeconds() {
    if (running && phaseEndAt !== null) {
      return Math.max(0, Math.round((phaseEndAt - Date.now()) / 1000));
    }
    if (remainingWhenPaused !== null) return remainingWhenPaused;
    return 0;
  }

  function isRunning() { return running; }

  function tick() {
    const remaining = getRemainingSeconds();

    if (onTick) onTick(remaining, running);

    if (onWarning) {
      if (remaining <= 300 && remaining > 0 && !warnedFlags.has('5min')) {
        warnedFlags.add('5min');
        onWarning('5min', remaining);
      }
      if (remaining <= 60 && remaining > 0 && !warnedFlags.has('1min')) {
        warnedFlags.add('1min');
        onWarning('1min', remaining);
      }
    }

    if (running && remaining <= 0) {
      running = false;
      phaseEndAt = null;
      if (onComplete) onComplete();
    }
  }

  // Loop de atualização visual — 4x por segundo é suficiente para
  // parecer "tempo real" sem gastar recursos (requisito de baixo consumo).
  intervalId = setInterval(tick, 250);

  function destroy() {
    clearInterval(intervalId);
  }

  return {
    startPhase, pause, resume, stop, addSeconds,
    getRemainingSeconds, isRunning, destroy,
    // Permite restaurar um cronômetro em andamento após recarregar a página.
    restoreRunning(endAtEpochMs) {
      clearWarnings();
      phaseEndAt = endAtEpochMs;
      remainingWhenPaused = null;
      running = true;
      tick();
    },
    restorePaused(remainingSeconds) {
      clearWarnings();
      phaseEndAt = null;
      remainingWhenPaused = remainingSeconds;
      running = false;
      tick();
    },
    getPhaseEndAt() { return phaseEndAt; },
  };
}
