/* ============================================================
   ui.js
   Única camada que toca o DOM para exibir dados. Não guarda
   estado próprio — só lê o que recebe e escreve na tela.
   ============================================================ */

window.PokerClockUI = (() => {

  const el = {};

  function cacheElements() {
    const ids = [
      'setup-screen', 'app-shell', 'break-overlay', 'operator-drawer',
      'levels-editor-modal', 'tournament-name', 'tournament-date',
      'level-badge', 'timer-display', 'timer-status',
      'blind-sb', 'blind-bb', 'blind-ante', 'next-level-preview',
      'stat-registered', 'stat-remaining', 'stat-tables',
      'break-timer', 'break-return-time',
      'op-pause-resume', 'op-toggle-mute',
      'reg-value', 'rem-value', 'tab-value',
      'levels-table-body', 'break-after-input', 'break-duration-input',
    ];
    ids.forEach(id => { el[id] = document.getElementById(id); });
  }

  function formatMMSS(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function formatClockTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function showSetup() {
    el['setup-screen'].classList.remove('hidden');
    el['app-shell'].classList.add('hidden');
    el['break-overlay'].classList.add('hidden');
  }

  function showApp() {
    el['setup-screen'].classList.add('hidden');
    el['app-shell'].classList.remove('hidden');
  }

  // Renderiza o estado completo do torneio na tela.
  function render(state, remainingSeconds, isRunning) {
    el['tournament-name'].textContent = state.name || 'Torneio sem nome';
    el['tournament-date'].textContent = state.date
      ? new Date(state.date + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';

    el['stat-registered'].textContent = state.registeredPlayers;
    el['stat-remaining'].textContent = state.remainingPlayers;
    el['stat-tables'].textContent = state.activeTables;
    el['reg-value'].textContent = state.registeredPlayers;
    el['rem-value'].textContent = state.remainingPlayers;
    el['tab-value'].textContent = state.activeTables;

    const phase = PokerClockLevels.describePhase(state.levels, state.settings, state.currentLevelNumber, state.isBreak);

    if (state.isBreak) {
      el['break-overlay'].classList.remove('hidden');
      el['break-timer'].textContent = formatMMSS(remainingSeconds);
      const returnAt = new Date(Date.now() + remainingSeconds * 1000);
      el['break-return-time'].textContent = `Retorno previsto às ${formatClockTime(returnAt)}`;
    } else {
      el['break-overlay'].classList.add('hidden');
      el['level-badge'].textContent = phase ? phase.number : '—';
      el['blind-sb'].textContent = phase ? phase.sb.toLocaleString('pt-BR') : '—';
      el['blind-bb'].textContent = phase ? phase.bb.toLocaleString('pt-BR') : '—';
      el['blind-ante'].textContent = phase && phase.ante ? phase.ante.toLocaleString('pt-BR') : '—';

      el['timer-display'].textContent = formatMMSS(remainingSeconds);
      el['timer-display'].classList.remove('warn-5', 'warn-1', 'paused');
      if (!isRunning) {
        el['timer-display'].classList.add('paused');
      } else if (remainingSeconds <= 60) {
        el['timer-display'].classList.add('warn-1');
      } else if (remainingSeconds <= 300) {
        el['timer-display'].classList.add('warn-5');
      }
    }

    el['timer-status'].textContent = state.isBreak
      ? ''
      : (isRunning ? '' : 'Pausado');

    const nextText = PokerClockLevels.describeNext(state.levels, state.settings, state.currentLevelNumber, state.isBreak);
    el['next-level-preview'].innerHTML = `Próximo: <strong>${nextText}</strong>`;

    el['op-pause-resume'].textContent = isRunning ? '⏸ Pausar' : '▶ Retomar';
    el['op-toggle-mute'].textContent = PokerClockAudio.isMuted() ? '🔇 Som desativado' : '🔊 Som ativado';
  }

  function openDrawer() { el['operator-drawer'].classList.add('open'); }
  function closeDrawer() { el['operator-drawer'].classList.remove('open'); }

  function openLevelsModal() { el['levels-editor-modal'].classList.remove('hidden'); }
  function closeLevelsModal() { el['levels-editor-modal'].classList.add('hidden'); }

  function levelRowHTML(level, isBreakAfter) {
    return `
      <tr data-number="${level.number}" class="${isBreakAfter ? 'is-break' : ''}">
        <td><input type="number" class="lv-number" value="${level.number}" min="1" style="width:3.5rem;"></td>
        <td><input type="number" class="lv-sb" value="${level.sb}" min="0"></td>
        <td><input type="number" class="lv-bb" value="${level.bb}" min="0"></td>
        <td><input type="number" class="lv-ante" value="${level.ante || 0}" min="0"></td>
        <td><input type="number" class="lv-duration" value="${level.durationMinutes}" min="1" style="width:3.5rem;"></td>
        <td class="row-actions"><button class="lv-remove" title="Remover">✕</button></td>
      </tr>`;
  }

  function renderLevelsEditor(state) {
    el['break-after-input'].value = state.settings.breakAfterLevels[0] || '';
    el['break-duration-input'].value = state.settings.breakDurationMinutes;
    el['levels-table-body'].innerHTML = state.levels
      .map(lv => levelRowHTML(lv, PokerClockLevels.isBreakAfter(state.settings, lv.number)))
      .join('');
  }

  function addEmptyLevelRow(nextNumber) {
    const tpl = document.createElement('tbody');
    tpl.innerHTML = levelRowHTML({ number: nextNumber, sb: 0, bb: 0, ante: 0, durationMinutes: 20 }, false);
    el['levels-table-body'].appendChild(tpl.firstElementChild);
  }

  // Lê a tabela do editor e devolve { levels, settings } — não grava nada sozinho.
  function readLevelsEditor() {
    const rows = Array.from(el['levels-table-body'].querySelectorAll('tr'));
    const levels = rows.map(row => ({
      number: parseInt(row.querySelector('.lv-number').value, 10) || 1,
      sb: parseInt(row.querySelector('.lv-sb').value, 10) || 0,
      bb: parseInt(row.querySelector('.lv-bb').value, 10) || 0,
      ante: parseInt(row.querySelector('.lv-ante').value, 10) || 0,
      durationMinutes: parseInt(row.querySelector('.lv-duration').value, 10) || 1,
    })).sort((a, b) => a.number - b.number);

    const breakAfterRaw = parseInt(el['break-after-input'].value, 10);
    const settings = {
      breakAfterLevels: breakAfterRaw ? [breakAfterRaw] : [],
      breakDurationMinutes: parseInt(el['break-duration-input'].value, 10) || 25,
      warnAtSeconds: [300, 60],
    };
    return { levels, settings };
  }

  return {
    cacheElements, formatMMSS, showSetup, showApp, render,
    openDrawer, closeDrawer, openLevelsModal, closeLevelsModal,
    renderLevelsEditor, addEmptyLevelRow, readLevelsEditor,
    elements: el,
  };
})();
