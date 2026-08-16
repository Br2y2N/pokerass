/* ============================================================
   storage.js
   Responsável por salvar/carregar o estado do torneio.

   - Salvamento automático: localStorage (funciona offline,
     sobrevive a recarregamento de página — requisito 5 da spec).
   - Exportação/importação: arquivo .json, útil para levar a
     estrutura de um evento para outro computador/dispositivo.

   Este módulo não sabe nada sobre cronômetro ou UI — só grava
   e lê o objeto de estado.
   ============================================================ */

window.PokerClockStorage = (() => {

  const STORAGE_KEY = 'poker-clock:state:v1';

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      console.warn('Não foi possível salvar automaticamente:', err);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Não foi possível carregar o torneio salvo:', err);
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignora */ }
  }

  function exportToFile(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (state.name || 'torneio').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `${safeName || 'torneio'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(JSON.parse(reader.result));
        } catch (err) {
          reject(new Error('Arquivo inválido — não é um .json de torneio válido.'));
        }
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.readAsText(file);
    });
  }

  return { save, load, clear, exportToFile, importFromFile };
})();
