/* ============================================================
   levels.js
   Tudo relacionado à estrutura de blinds e à regra de intervalo.

   Implementa a "Regra Especial de Intervalo" da spec de forma
   ligeiramente generalizada: em vez de um único número fixo (10),
   guardamos breakAfterLevels como uma lista. Com a configuração
   padrão ([10]) o comportamento é EXATAMENTE o descrito na spec.
   Isso só existe para permitir múltiplos intervalos em torneios
   reais mais longos, sem quebrar o caso original.
   ============================================================ */

window.PokerClockLevels = (() => {

  function getLevel(levels, levelNumber) {
    return levels.find(l => l.number === levelNumber) || null;
  }

  function isBreakAfter(settings, levelNumber) {
    return settings.breakAfterLevels.includes(levelNumber);
  }

  // Retorna a descrição completa da fase atual (nível ou intervalo).
  function describePhase(levels, settings, levelNumber, isBreak) {
    if (isBreak) {
      return {
        type: 'break',
        durationSeconds: settings.breakDurationMinutes * 60,
        afterLevel: levelNumber,
      };
    }
    const level = getLevel(levels, levelNumber);
    if (!level) return null;
    return {
      type: 'level',
      number: level.number,
      sb: level.sb,
      bb: level.bb,
      ante: level.ante,
      durationSeconds: level.durationMinutes * 60,
    };
  }

  // Texto de prévia do próximo nível/intervalo, para o painel principal.
  function describeNext(levels, settings, levelNumber, isBreak) {
    if (isBreak) {
      const next = getLevel(levels, levelNumber + 1);
      if (!next) return 'Fim da estrutura cadastrada';
      return `Nível ${next.number} — ${next.sb}/${next.bb}${next.ante ? ' (ante ' + next.ante + ')' : ''}`;
    }
    if (isBreakAfter(settings, levelNumber)) {
      return `Intervalo (${settings.breakDurationMinutes} min)`;
    }
    const next = getLevel(levels, levelNumber + 1);
    if (!next) return 'Último nível cadastrado';
    return `Nível ${next.number} — ${next.sb}/${next.bb}${next.ante ? ' (ante ' + next.ante + ')' : ''}`;
  }

  // Avança para a próxima fase. Retorna { levelNumber, isBreak, ended }.
  function advance(levels, settings, levelNumber, isBreak) {
    if (isBreak) {
      const next = getLevel(levels, levelNumber + 1);
      if (!next) return { levelNumber, isBreak: false, ended: true };
      return { levelNumber: next.number, isBreak: false, ended: false };
    }
    if (isBreakAfter(settings, levelNumber)) {
      return { levelNumber, isBreak: true, ended: false };
    }
    const next = getLevel(levels, levelNumber + 1);
    if (!next) return { levelNumber, isBreak: false, ended: true };
    return { levelNumber: next.number, isBreak: false, ended: false };
  }

  // Volta para a fase anterior. Reinicia com a duração cheia da fase.
  function previous(levels, settings, levelNumber, isBreak) {
    if (isBreak) {
      return { levelNumber, isBreak: false };
    }
    const prevLevel = getLevel(levels, levelNumber - 1);
    if (!prevLevel) return { levelNumber, isBreak: false };
    if (isBreakAfter(settings, prevLevel.number)) {
      return { levelNumber: prevLevel.number, isBreak: true };
    }
    return { levelNumber: prevLevel.number, isBreak: false };
  }

  return { getLevel, isBreakAfter, describePhase, describeNext, advance, previous };
})();
