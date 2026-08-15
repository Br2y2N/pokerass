# Relógio de Torneio de Poker

Sistema de gerenciamento de torneios de poker: cronômetro de níveis, estrutura
de blinds, intervalo automático, painel para telão/TV e painel de controle do
operador. HTML/CSS/JS puro — sem build, sem framework, sem dependência de
internet para funcionar.

## Como colocar no ar (acesso de qualquer lugar)

É um site estático — três formas simples, escolha a que for mais prática:

1. **GitHub Pages (grátis, recomendado)**
   Crie um repositório, suba estes arquivos, ative o GitHub Pages nas
   configurações do repositório (branch `main`, pasta raiz). Em minutos você
   tem uma URL pública (`https://seuusuario.github.io/repo`) acessível de
   qualquer TV, notebook, tablet ou celular com navegador.

2. **Netlify / Vercel (arrastar e soltar)**
   Arraste a pasta inteira no painel da Netlify (app.netlify.com/drop). Gera
   uma URL pública na hora, sem precisar de conta no GitHub.

3. **Uso local, sem internet, no dia do evento**
   Basta abrir o arquivo `index.html` direto no navegador (duplo clique).
   Funciona sem servidor e sem internet — só a fonte tipográfica (Google
   Fonts) não carrega offline, e nesse caso o sistema usa fontes do sistema
   como alternativa (o layout continua funcionando normalmente).

Em qualquer um dos três casos, o app funciona igual em celular, tablet,
notebook ou Smart TV com navegador — é responsivo e tem modo tela cheia
(botão "⛶ Tela cheia" no canto superior).

## Estrutura do projeto

```
index.html          Marcação de todas as telas (setup, painel, intervalo,
                     gaveta do operador, editor de níveis)
css/style.css        Todo o visual do sistema
js/config.js         Estrutura padrão de níveis e configurações iniciais
js/storage.js        Salvamento automático (localStorage) + exportar/importar .json
js/audio.js          Alertas sonoros (sintetizados, não usa arquivos de áudio)
js/timer.js          Motor do cronômetro (baseado em horário absoluto, não
                     em contagem ingênua — não perde precisão se a aba ficar
                     em segundo plano ou a página for recarregada)
js/levels.js         Regras de avanço de nível e da pausa programada (intervalo)
js/ui.js             Só renderização — lê o estado e atualiza a tela
js/operator.js       Só conecta cliques de botão às ações do app
js/main.js           Junta tudo: estado do torneio + ações (iniciar, pausar,
                     avançar nível, ajustar tempo, etc.)
test/smoke.js        Teste automatizado que simula um torneio inteiro,
                     incluindo o intervalo após o nível 10 (ver abaixo)
```

Cada arquivo tem uma responsabilidade só. Para alterar o som, mexe só em
`audio.js`; para mudar a regra do intervalo, só em `levels.js`; para mudar o
visual, só em `style.css`. Nenhum arquivo depende de conhecer os detalhes
internos dos outros.

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

## Rodando o teste automatizado (opcional)

O teste simula um torneio completo — criação, início, pausa, avanço e volta
de nível, o intervalo automático disparando exatamente após o nível 10 (regra
da especificação), intervalo manual, contadores de jogadores, edição de
níveis e persistência.

```
npm install jsdom --save-dev
npm test
```

## Fidelidade à especificação original

| Requisito da spec | Onde está implementado |
|---|---|
| Cronômetro MM:SS, iniciar/pausar/retomar/encerrar | `js/timer.js` |
| Avisos sonoros em 5 min, 1 min e troca de nível | `js/timer.js` + `js/audio.js` |
| Estrutura de níveis (nº, SB, BB, ante, duração) | `js/config.js` + editor em `js/ui.js` |
| Intervalo automático de 25 min após o nível 10 | `js/levels.js` (`breakAfterLevels`) |
| Painel com nome, data, nível, blinds, próximo nível, jogadores, mesas | `index.html` + `js/ui.js` |
| Controles do operador (iniciar, pausar, avançar, voltar, intervalo manual, encerrar) | `js/operator.js` |
| Tela cheia, responsivo, tempo real sem recarregar | `css/style.css` + `js/timer.js` |
| Salvamento automático da estrutura | `js/storage.js` (localStorage) |
| Precisão de ±1s | cronômetro baseado em horário absoluto (`Date.now()`), não em contagem por `setInterval` |
