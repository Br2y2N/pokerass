/* ============================================================
   config.js
   Valores padrão do sistema. Tudo aqui é apenas um ponto de
   partida — o operador edita a estrutura real na tela de
   "Estrutura de níveis" antes (ou durante) o torneio.
   ============================================================ */

window.PokerClockConfig = (() => {

  // Estrutura padrão sugerida (o usuário deve ajustar para o evento real).
  // Segue o padrão do documento de especificação: níveis de 20 min,
  // ante entrando a partir de um certo ponto, intervalo após o nível 10.
  function buildDefaultLevels() {
    const raw = [
      [1, 100, 200, 0],
      [2, 200, 400, 0],
      [3, 300, 600, 0],
      [4, 400, 800, 0],
      [5, 500, 1000, 0],
      [6, 600, 1200, 0],
      [7, 800, 1600, 200],
      [8, 1000, 2000, 200],
      [9, 1500, 3000, 300],
      [10, 2000, 4000, 400],
      [11, 2500, 5000, 500],
      [12, 3000, 6000, 500],
      [13, 4000, 8000, 1000],
      [14, 5000, 10000, 1000],
    ];
    return raw.map(([number, sb, bb, ante]) => ({
      number, sb, bb, ante, durationMinutes: 20
    }));
  }

  const DEFAULT_SETTINGS = {
    breakAfterLevels: [10],   // regra do projeto: intervalo após o nível 10
    breakDurationMinutes: 25,
    warnAtSeconds: [300, 60], // avisos sonoros: 5 min e 1 min restantes
  };

  return { buildDefaultLevels, DEFAULT_SETTINGS };
})();
