/* ============================================================
   audio.js
   Alertas sonoros sintetizados via Web Audio API.

   Por quê sintetizado em vez de arquivos .mp3?
   - Funciona 100% offline (importante: wi-fi de local de evento
     é sempre a coisa mais instável da noite).
   - Zero dependência externa, zero peso de download.

   O navegador só libera áudio depois de uma interação do usuário
   (clique). Por isso existe unlock(), chamado no primeiro clique
   em qualquer botão do operador.
   ============================================================ */

window.PokerClockAudio = (() => {

  let ctx = null;
  let muted = false;

  function unlock() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function setMuted(value) { muted = value; }
  function isMuted() { return muted; }

  function tone(freq, startOffset, duration, gainPeak = 0.18) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const t0 = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  // Sequências nomeadas — uma "assinatura sonora" curta para cada evento.
  function playTournamentStart() {
    tone(523, 0, 0.18); tone(659, 0.16, 0.18); tone(784, 0.32, 0.3);
  }

  function playLevelChange() {
    tone(660, 0, 0.14); tone(880, 0.15, 0.2);
  }

  function playWarning5Min() {
    tone(740, 0, 0.15);
  }

  function playWarning1Min() {
    tone(740, 0, 0.12); tone(740, 0.18, 0.12);
  }

  function playBreakStart() {
    tone(392, 0, 0.2); tone(330, 0.2, 0.2); tone(262, 0.4, 0.4);
  }

  function playBreakEnd() {
    tone(523, 0, 0.16); tone(659, 0.15, 0.16); tone(784, 0.3, 0.16); tone(988, 0.45, 0.3);
  }

  return {
    unlock, setMuted, isMuted,
    playTournamentStart, playLevelChange,
    playWarning5Min, playWarning1Min,
    playBreakStart, playBreakEnd,
  };
})();
