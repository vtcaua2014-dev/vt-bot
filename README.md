# Vt4Fun — jogos e diversão para Discord

Projeto inicial em **Node.js 20+ / discord.js 14**, com 25 minijogos, roleplays, economia fictícia, Gartic, adivinhador original, figurinhas de mídia existente e IA Luna 1.5X por Ollama.

> **Estado:** MVP de código-fonte. O núcleo foi verificado por testes locais de lógica e checagem de sintaxe. Não foi conectado a uma aplicação Discord real: você precisa criar sua aplicação e fornecer um token privado. Alguns minijogos são versões simplificadas, não clones comerciais.

## Recursos

- **25 minijogos:** Jogo da Velha, Forca, Wordle, Trivia, Bandeiras, Matemática Rápida, Memória, RPG de Masmorras, Zumbis, Dungeon Boss, Captura de Criaturas Originais, Pesca, Corrida, Reflexos, Arena PvP, Battle Royale, Pênaltis, Blackjack, Poker de 5 cartas, Roleta, Caça-Níqueis, Cara ou Coroa, Pedra/Papel/Tesoura, Campo Minado e Connect 4.
- **Multiplayer:** Jogo da Velha, Connect 4, Corrida, Arena PvP e Pedra/Papel/Tesoura aceitam oponente com `/jogo nome:... oponente:@pessoa`; Battle Royale aceita participantes no lobby. Outros jogos são contra bot ou solo.
- **Funcoins:** carteira fictícia inicial com 250, `/daily` +150 a cada data UTC, `/saldo`, `/ranking`, `/pagar`. Apostas (1–1000, padrão 20) somente nos cinco jogos de cartas/sorte, deduzidas ao iniciar a partida. **Sem dinheiro real, cripto, depósitos, saques, NFTs ou prêmios negociáveis.**
- **Gartic:** `/gartic iniciar` envia uma palavra secretamente ao desenhista. O desenhista publica uma imagem que ele fez via `/gartic desenhar`; outras pessoas tentam `/gartic palpite`.
- **Adivinhador:** jogo de perguntas com base local e personagens/categorias pré-definidos; **não usa o serviço oficial Akinator**.
- **Roleplay:** `/roleplay` e atalhos `/slap`, `/kiss`, além de `/ship`, `/gaydar`. Este último é medidor aleatório de arco-íris, **não determina orientação sexual**.
- **Figurinhas:** `/album pagina:1` a `5` mostra **10 imagens/GIFs encontrados no Wikimedia Commons** por página (50 itens) em cinco temas: esportes, cinema, personagens/desenhos, educativo/cultural, animais. O catálogo é consultado na primeira visita e salvo no arquivo de dados; cada mídia traz origem, autor e licença. O filtro automatizado rejeita títulos/descrições de IA conhecidos, mas **não comprova que todo arquivo é humano**; faça curadoria editorial antes de divulgar um catálogo definitivo. Algumas páginas podem não conter GIFs caso o acervo licenciado não disponibilize resultados.
- **IA Luna:** utiliza Ollama `/api/chat` com `llama3.2:3b` (ou modelo configurável). O ZIP de extensão fornecido era um cliente do Ollama, **não um modelo GPT-5.6 Luna**. O bot não incorpora pesos proprietários.
- **Menções automáticas:** quando **o próprio bot** ou **um cargo exato configurado** é mencionado, responde. `@everyone`, `@here` e cargos alternativos não acionam a IA. Requer bot instalado no servidor e habilitar o intent Message Content.
- **Painel:** publicado uma única vez no ingresso. Em servidores Community prioriza um canal restrito `moderator-only`/`staff`/`admin`; nos demais, `chat`/`geral`. Se não houver canal seguro, use `/painel`. Seis idiomas nas configurações (PT pré-definido, EN, ES, FR, DE, ZH). Atualmente as traduções completas abrangem painel e comportamento da IA; minijogos e textos de comandos permanecem principalmente em português.
- **Instalação:** guild-install e user-install para slash commands compatíveis, com limitações impostas pelo Discord. Eventos de entrada e menções de cargo não existem no contexto apenas de instalação pelo perfil.

## 1. Criar o bot no Discord

1. Abra <https://discord.com/developers/applications> e crie uma aplicação **Vt4Fun**.
2. Em **Bot**, crie o usuário de bot e obtenha o **token**. Não compartilhe este token e **nunca** envie o arquivo `.env` ao GitHub.
3. Ative **Message Content Intent** no Developer Portal para receber o conteúdo das mensagens que contêm menções.
4. Em **Installation**, habilite **Guild Install** e **User Install**. Configure escopos `bot` e `applications.commands` para servidor; `applications.commands` para perfil. Configure a URL oficial de instalação.
5. Para servidor, conceda só o necessário: View Channels, Send Messages, Embed Links, Read Message History, Use Application Commands, Attach Files se necessário. O dono do servidor precisa autorizar a instalação.
6. Copie **Application ID** e guarde como `DISCORD_CLIENT_ID`.

## 2. Instalar e executar localmente

```bash
npm install
cp .env.example .env
# Edite .env com DISCORD_TOKEN, DISCORD_CLIENT_ID e, opcionalmente, DISCORD_GUILD_ID
npm run deploy:commands
npm start
```

No Windows PowerShell, use `Copy-Item .env.example .env` em vez de `cp`.

Use `DISCORD_GUILD_ID` ao testar para registro imediato de comandos no servidor. Remova-o e execute `npm run deploy:commands` novamente ao preparar o registro global. Os comandos globais podem levar algum tempo para aparecer.

### IA via Ollama

O ZIP Luna 1.5X fornecido usa `llama3.2:3b`; em seu computador:

```bash
ollama pull llama3.2:3b
ollama serve
```

Se já houver instância Ollama, não execute `ollama serve` uma segunda vez. Em `OLLAMA_URL`, informe a URL de um servidor Ollama **privado** acessível pelo processo do bot. O endereço `127.0.0.1` de um bot hospedado na nuvem aponta para o próprio container, não para seu PC. **Nunca exponha a porta 11434 diretamente na internet.** O campo `OLLAMA_API_KEY` é opcional para gateways privados que aceitam header Bearer; o Ollama local normalmente não usa token.

Desabilite IA temporariamente definindo `AI_ENABLED=false`. Histórico da IA é curto, mantido só na RAM por até uma hora, sem gravação de conversas do usuário no JSON.

## 3. Principais comandos

| Comando | Exemplo |
|---|---|
| `/ajuda` | Mostrar recursos |
| `/jogo` | `/jogo nome:velha oponente:@amigo` |
| `/jogo` | `/jogo nome:roleta aposta:50` |
| `/quiz` | Trivia |
| `/daily` | +150 Funcoins/UTC |
| `/saldo` | Carteira |
| `/pagar` | Transferir moeda fictícia |
| `/ranking` | Pontuação global |
| `/roleplay` | `/roleplay tipo:hug alvo:@amigo` |
| `/ship` | Compatibilidade de brincadeira |
| `/gaydar` | Radar arco-íris fictício |
| `/album` | `/album pagina:3` |
| `/adivinhador` | Perguntas de sim/não |
| `/gartic` | Iniciar, desenhar, palpite, encerrar |
| `/ia perguntar` | Falar com a Luna |
| `/config idioma` | Alterar idioma (Gerenciar Servidor) |
| `/config cargo` | Definir **único** cargo que menciona a IA |
| `/painel` | Mostrar painel de configuração |

## 4. Hospedagem — Railway

**Recomendação:** <https://railway.com/> como serviço Node.js **sempre ativo**, sem Serverless/Sleep. Use este repositório do GitHub, conecte ao projeto Railway e defina `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATA_PATH=/data/db.json`, `OLLAMA_URL`, `OLLAMA_MODEL` e `AI_ENABLED`. Monte um **Volume persistente** em `/data`: sem ele, um redeploy perde carteiras, configurações e álbuns. Só rode **uma réplica** com este armazenamento JSON. Primeiro registre comandos com `npm run deploy:commands` via shell local ou serviço de execução única, depois inicie o serviço.

O plano gratuito ou trial, se disponível, tem limites/créditos; confira os preços atuais: <https://docs.railway.com/pricing/free-plan>. IA hospedada junto com o bot pode exceder a memória de instâncias pequenas: rode Ollama em uma máquina separada ou use API segura de um provedor compatível.

**Render:** <https://render.com/hosting/discord-bots> — use **Background Worker pago**. Web Service gratuito hiberna após inatividade e não é adequado a bot Gateway 24/7.

### Publicar no GitHub (repo `vt-bot`)

Se você ainda não criou esse repositório, crie-o em <https://github.com/new?name=vt-bot> em sua conta. Depois, extraia este ZIP no computador e rode:

```bash
git init
git add .
git commit -m "feat: initial Vt4Fun Discord bot"
git branch -M main
git remote add origin https://github.com/vtcaua2014-dev/vt-bot.git
git push -u origin main
```

A pasta `data/`, o `.env` e `node_modules/` são ignorados pelo Git. Não faça `git add` dos tokens. Caso seu repositório já tenha um README gerado pelo GitHub, prefira cloná-lo e copiar os arquivos para evitar conflitos de histórico.

## 5. Testes e limitações

```bash
npm run check
npm test
```

- Partidas, lobbies e sequências do Gartic ficam em RAM e **não sobrevivem a reinício**. Funcoins, preferências e catálogo de figurinhas são persistentes no JSON.
- Wordle utiliza lista inicial curta de palavras; Poker é duelo simplificado de 5 cartas contra CPU; Battle Royale é eliminação por turnos; os jogos não incluem Activity WebGL/Canvas. Expandir as mecânicas exige desenvolvimento e testes adicionais.
- O álbum depende de acesso à API do Wikimedia Commons na primeira consulta; há filtros de licença e um catálogo salvo, mas a revisão humana de imagens e de direitos de obras culturais permanece necessária.
- Para uso em muitos servidores, substitua o JSON por PostgreSQL e implemente travas de partidas, auditoria de transações e limites de requisição distribuídos.
- Não inclua segredos no repositório, não use conteúdo ou código proprietário de outros bots e respeite as regras do Discord, direitos autorais e licenças das mídias.
