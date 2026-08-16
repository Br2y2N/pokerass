# Relógio de Torneio de Poker

Sistema de gerenciamento de torneios de poker: cronômetro de níveis, estrutura
de blinds, intervalo automático, painel para telão/TV e painel de controle do
operador. HTML/CSS/JS puro — sem build, sem framework, sem dependência de
internet para funcionar.

Todos os arquivos ficam juntos, direto na raiz do projeto — sem subpastas —
justamente para facilitar o upload no GitHub Pages.

## Como colocar no ar (acesso de qualquer lugar)

**GitHub Pages (grátis, recomendado):**

1. Crie um repositório novo no GitHub.
2. Na página do repositório, clique em **Add file → Upload files** e arraste
   todos os arquivos deste pacote de uma vez (sem pasta por cima — eles já
   vão soltos).
3. Confirme o commit.
4. Vá em **Settings → Pages**, em "Branch" escolha `main` e pasta `/ (root)`,
   salve.
5. Em 1–2 minutos o GitHub mostra a URL pública
   (`https://seuusuario.github.io/nome-do-repo`) — acessível de qualquer TV,
   notebook, tablet ou celular com navegador.

**Alternativas:**
- **Netlify/Vercel:** arraste a pasta inteira em app.netlify.com/drop — gera
  uma URL pública na hora, sem precisar de GitHub.
- **Uso local, sem internet:** abra `index.html` direto no navegador (duplo
  clique). Funciona sem servidor — só a fonte do Google Fonts não carrega
  offline, e nesse caso o sistema cai para fontes do sistema automaticamente
  (o layout continua funcionando normalmente).

Em qualquer um dos casos, o app funciona igual em celular, tablet, notebook
ou Smart TV com navegador — é responsivo e tem modo tela cheia (botão
"⛶ Tela cheia" no canto superior).

## Arquivos do projeto

```
index.html      Marcação de todas as telas (setup, painel, intervalo,
                gaveta do operador, editor de níveis)
style.css       Todo o visual do sistema
config.js       Estrutura padrão de níveis e configurações iniciais
storage.js      Salvamento automático (localStorage) + exportar/importar .json
audio.js        Alertas sonoros (sintetizados, não usa arquivos de áudio)
timer.js        Motor do cronômetro (baseado em horário absoluto, não em
                contagem ingênua — não perde precisão se a aba ficar em
                segundo plano ou a página for recarregada)
levels.js       Regras de avanço de nível e da pausa programada (intervalo)
ui.js           Só renderização — lê o estado e atualiza a tela
operator.js     Só conecta cliques de botão às ações do app
main.js         Junta tudo: estado do torneio + ações (iniciar, pausar,
                avançar nível, ajustar tempo, etc.)
```

Estarem todos na mesma pasta é só uma questão de facilidade de upload — cada
arquivo continua com uma responsabilidade só. Para alterar o som, mexe só em
`audio.js`; para mudar a regra do intervalo, só em `levels.js`; para mudar o
visual, só em `style.css`. Nenhum arquivo depende de conhecer os detalhes
internos dos outros, e a ordem de carregamento no `index.html` já está
correta — não precisa reordenar nada.

## Uso no dia do torneio

1. Abra o sistema, preencha nome, data, jogadores inscritos e mesas.
2. Antes de criar o torneio, clique em **"Editar estrutura de níveis"** e
   ajuste os blinds/durações reais do seu evento (o sistema já vem com uma
   estrutura de exemplo pronta, mas o ideal é conferir/ajustar para o seu
   formato). Ali também se define depois de qual nível entra o intervalo e
   por quantos minutos.
3. Clique em **Criar torneio** e depois em **▶ Iniciar** (dentro do painel
   do operador, ícone "⚙ Operador" no canto superior).
4. O sistema cuida sozinho de: avisos sonoros aos 5 min e 1 min, troca de
   nível, e do intervalo automático (ao concluir o nível configurado, entra
   em intervalo, exibe o horário previsto de retorno, e ao final volta
   automaticamente para o próximo nível).
5. Use a gaveta do operador para pausar, voltar/avançar nível manualmente,
   ajustar o tempo em ±1 min, atualizar contagem de jogadores/mesas, forçar
   um intervalo fora do previsto, ou encerrar o torneio.

**Sobre o intervalo manual:** se você clicar em "Iniciar intervalo" no meio
de um nível (por exemplo, para trocar baralhos), o sistema pausa aquele
nível guardando o tempo que faltava, faz o intervalo, e ao voltar retoma o
mesmo nível de onde parou — em vez de simplesmente pular pro próximo nível.

**Múltiplos dispositivos:** o salvamento automático é local a cada
navegador/dispositivo (não sincroniza sozinho entre o notebook do operador e
a TV, por exemplo). Para levar o mesmo torneio de um dispositivo a outro,
use **Exportar (.json)** num e **Importar (.json)** no outro.

## Fidelidade à especificação original

| Requisito da spec | Onde está implementado |
|---|---|
| Cronômetro MM:SS, iniciar/pausar/retomar/encerrar | `timer.js` |
| Avisos sonoros em 5 min, 1 min e troca de nível | `timer.js` + `audio.js` |
| Estrutura de níveis (nº, SB, BB, ante, duração) | `config.js` + editor em `ui.js` |
| Intervalo automático de 25 min após o nível 10 | `levels.js` (`breakAfterLevels`) |
| Painel com nome, data, nível, blinds, próximo nível, jogadores, mesas | `index.html` + `ui.js` |
| Controles do operador (iniciar, pausar, avançar, voltar, intervalo manual, encerrar) | `operator.js` |
| Tela cheia, responsivo, tempo real sem recarregar | `style.css` + `timer.js` |
| Salvamento automático da estrutura | `storage.js` (localStorage) |
| Precisão de ±1s | cronômetro baseado em horário absoluto (`Date.now()`), não em contagem por `setInterval` |
