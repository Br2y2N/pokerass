/* ============================================================
   operator.js
   Liga cliques de botão às ações do App. Não contém regra de
   negócio — só "o botão X chama a ação Y".
   ============================================================ */

window.PokerClockOperator = (() => {

  // Estado provisório usado enquanto o torneio ainda não foi criado
  // (a tela de configuração permite editar a estrutura de níveis
  // antes de existir um App.state de verdade).
  let draftState = App.freshState();
  let levelsEditorContext = 'setup'; // 'setup' | 'live'

  function byId(id) { return document.getElementById(id); }

  function unlockAudioOnce() {
    PokerClockAudio.unlock();
    document.removeEventListener('pointerdown', unlockAudioOnce);
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // ---------------- Editor de níveis (modal compartilhado) ----------------

  function openLevelsEditor(context) {
    levelsEditorContext = context;
    const source = context === 'setup' ? draftState : App.getState();
    PokerClockUI.renderLevelsEditor(source);
    PokerClockUI.openLevelsModal();
  }

  function wireLevelsModal() {
    byId('levels-modal-close').addEventListener('click', PokerClockUI.closeLevelsModal);

    byId('levels-add-row').addEventListener('click', () => {
      const rows = byId('levels-table-body').querySelectorAll('tr');
      let maxNumber = 0;
      rows.forEach(r => {
        const n = parseInt(r.querySelector('.lv-number').value, 10) || 0;
        if (n > maxNumber) maxNumber = n;
      });
      PokerClockUI.addEmptyLevelRow(maxNumber + 1);
    });

    byId('levels-table-body').addEventListener('click', (e) => {
      if (e.target.classList.contains('lv-remove')) {
        e.target.closest('tr').remove();
      }
    });

    byId('levels-generate').addEventListener('click', () => {
      const levels = PokerClockConfig.buildDefaultLevels();
      const settings = { ...PokerClockConfig.DEFAULT_SETTINGS };
      if (levelsEditorContext === 'setup') {
        draftState.levels = levels;
        draftState.settings = settings;
        PokerClockUI.renderLevelsEditor(draftState);
      } else {
        const state = App.getState();
        state.levels = levels;
        state.settings = settings;
        PokerClockUI.renderLevelsEditor(state);
      }
    });

    byId('levels-save').addEventListener('click', () => {
      if (levelsEditorContext === 'setup') {
        const { levels, settings } = PokerClockUI.readLevelsEditor();
        draftState.levels = levels;
        draftState.settings = settings;
      } else {
        App.applyLevelsFromEditor();
      }
      PokerClockUI.closeLevelsModal();
    });
  }

  // ---------------- Tela de configuração inicial ----------------

  function wireSetupScreen() {
    byId('setup-edit-levels').addEventListener('click', () => openLevelsEditor('setup'));

    byId('setup-create').addEventListener('click', () => {
      unlockAudioOnce();
      const setupData = {
        name: byId('setup-name').value.trim(),
        date: byId('setup-date').value,
        registeredPlayers: parseInt(byId('setup-players').value, 10) || 0,
        remainingPlayers: parseInt(byId('setup-players').value, 10) || 0,
        activeTables: parseInt(byId('setup-tables').value, 10) || 0,
        levels: draftState.levels,
        settings: draftState.settings,
      };
      App.createNewFromSetup(setupData);
    });

    byId('setup-restore').addEventListener('click', () => {
      App.restoreSaved();
    });

    byId('setup-import').addEventListener('click', () => byId('import-file-input').click());

    byId('import-file-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await App.importData(file);
      } catch (err) {
        alert(err.message);
      }
      e.target.value = '';
    });
  }

  // ---------------- Painel do operador (torneio em andamento) ----------------

  function wireOperatorControls() {
    byId('btn-open-drawer').addEventListener('click', PokerClockUI.openDrawer);
    byId('btn-close-drawer').addEventListener('click', PokerClockUI.closeDrawer);
    byId('btn-fullscreen').addEventListener('click', toggleFullscreen);

    byId('op-start').addEventListener('click', () => { unlockAudioOnce(); App.start(); });
    byId('op-pause-resume').addEventListener('click', () => App.pauseResume());
    byId('op-prev-level').addEventListener('click', () => App.prevLevel());
    byId('op-next-level').addEventListener('click', () => App.nextLevel());
    byId('op-start-break').addEventListener('click', () => App.startBreakManually());

    byId('op-end-tournament').addEventListener('click', () => {
      if (confirmAction('Encerrar o torneio? Isso apaga os dados salvos deste torneio.')) {
        App.endTournament();
      }
    });

    byId('op-minus-1').addEventListener('click', () => App.adjustTime(-60));
    byId('op-plus-1').addEventListener('click', () => App.adjustTime(60));

    byId('reg-plus').addEventListener('click', () => App.changePlayerCount('registeredPlayers', 1));
    byId('reg-minus').addEventListener('click', () => App.changePlayerCount('registeredPlayers', -1));
    byId('rem-plus').addEventListener('click', () => App.changePlayerCount('remainingPlayers', 1));
    byId('rem-minus').addEventListener('click', () => App.changePlayerCount('remainingPlayers', -1));
    byId('tab-plus').addEventListener('click', () => App.changePlayerCount('activeTables', 1));
    byId('tab-minus').addEventListener('click', () => App.changePlayerCount('activeTables', -1));

    byId('op-edit-levels').addEventListener('click', () => openLevelsEditor('live'));
    byId('op-toggle-mute').addEventListener('click', () => App.toggleMute());

    byId('op-export').addEventListener('click', () => App.exportData());
    byId('op-import').addEventListener('click', () => byId('import-file-input').click());

    byId('op-new-tournament').addEventListener('click', () => {
      if (confirmAction('Apagar o torneio atual e começar um novo?')) {
        App.endTournament();
      }
    });

    document.addEventListener('pointerdown', unlockAudioOnce);
  }

  function init() {
    wireLevelsModal();
    wireSetupScreen();
    wireOperatorControls();
  }

  return { init };
})();
