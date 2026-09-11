# Clube de Talentos

Aplicação local para uma empresa, com React + TypeScript + Vite + Tailwind e API Node.js + TypeScript + Express. SQLite local, com adaptador PostgreSQL e ferramenta de migração para Supabase.

## Abrir

Node.js 24 ou superior é necessário. Na pasta do projeto:

```powershell
npm run install:all
npm run build
npm start
```

Abra http://localhost:3001. A primeira tela permite cadastrar a empresa e seu primeiro administrador. Não existe senha administrativa fixa. A opção de demonstração é facultativa; se não for marcada, a base inicia vazia.

No Windows, `Iniciar-Clube.ps1` inicia o servidor em segundo plano e abre o navegador. `Parar-Clube.ps1` encerra apenas o processo iniciado por esse lançador. Os lançadores usam a porta 3001.

Para desenvolver com atualização das telas: `npm run dev` e http://localhost:5173. A API atende na porta 3001. `npm test` executa os testes de integração e de regras de negócio. `npm run build` verifica os tipos dos dois projetos e compila o frontend.

## Primeiro uso

1. Cadastre clientes e postos em **Clientes**.
2. Cadastre colaboradores e suas alocações em **Colaboradores**. Uma nova movimentação encerra o vínculo anterior, mantendo o histórico.
3. Opcionalmente importe a base CSV/XLSX em **Importações**. Faça a prévia, confira as divergências e confirme.
4. Em **Configurações**, defina os pontos de cada nota, os pesos dos critérios, a justificativa de notas baixas, os elogios e as faixas Bronze/Prata/Ouro. Na aba Programa, marque a confirmação do regulamento revisado e salve.
5. Crie uma temporada e seus ciclos. As datas dos ciclos não podem se sobrepor. Ao iniciar a temporada, uma cópia integral das regras é preservada.
6. Ao iniciar cada ciclo, os participantes são definidos pelas alocações válidas na data de início. Movimentações posteriores não alteram esse contexto.
7. Crie os usuários em **Usuários e Acessos**, atribuindo perfis e vínculos. Cliente, Supervisor e Fiscal precisam de clientes ou postos vinculados. Permissões são editáveis por perfil.
8. Avaliadores entram e preenchem uma pessoa por vez. Podem salvar rascunho, pular ou justificar impossibilidade quando o regulamento permitir.
9. Acompanhe Pendentes, Concluídas e Histórico. Responsáveis podem aprovar elogios, cancelar ou reabrir uma avaliação para o avaliador original, com motivo e versão anterior preservada.
10. Encerre os ciclos e a temporada e publique o resultado. O ranking publicado é congelado. A publicação automática, quando ativada no regulamento, ocorre na data cadastrada com o servidor em execução.

## Pontuação

Cada nota possui uma descrição e um valor em pontos configuráveis. A avaliação soma `pontos da nota × peso do critério`. Elogios acrescentam o valor configurado, após aprovação quando exigida.

O ciclo considera a média ponderada das avaliações enviadas, usando o peso do perfil do avaliador preservado no regulamento. A temporada usa a média dos ciclos com avaliações. A elegibilidade exige o mínimo de ciclos configurado. Avaliações canceladas, impossibilidades e rascunhos não pontuam.

O regulamento inicial vem marcado como provisório: notas 1–5 valem 0, 10, 20, 30 e 40 pontos, respectivamente. Esses valores são exemplos, não uma regra oficial da empresa. O início de uma temporada exige revisão explícita. Faixas iniciais: Bronze a partir de 70, Prata a partir de 80 e Ouro a partir de 90. Diamante exige Ouro em duas temporadas consecutivas, quantidade configurável.

Desempate: pontos, critérios na ordem configurada, elogios aprovados, avaliação mais antiga e, por último, identificador estável. A configuração define a ordem dos cinco critérios iniciais de desempate.

## O que está implementado

- Dashboard com indicadores calculados e progresso por cliente.
- Avaliar, Pendentes, Concluídas e Histórico com filtros, paginação, detalhes, rascunhos e revisão.
- Ranking geral, por cliente, pódio e histórico publicado; conquistas Bronze/Prata/Ouro/Diamante.
- Clientes, postos, colaboradores e alocações históricas.
- Temporadas, ciclos, participantes congelados, encerramento e publicação.
- Importação CSV/XLSX com mapeamento de colunas, prévia, validação, confirmação transacional e histórico. A importação da base cria/atualiza clientes, postos e colaboradores juntos. Não importa avaliações antigas.
- Relatórios com CSV, Excel e impressão/salvar PDF de todos os registros filtrados.
- Login, logout, troca de senha, administração de usuários, perfis e vínculos por cliente/posto.
- Configuração de critérios, escala, pesos, elogios, faixas, prazos, mínimo de ciclos e auditoria.
- Notificações internas de pendências. E-mail e WhatsApp não são enviados pelo sistema.

## Banco, segurança e operação

O banco fica em `backend/data/clube.sqlite`. Não adicione esse arquivo ao Git. Para backup manual seguro, encerre o servidor e copie toda a pasta `backend/data`. A perda do arquivo implica perda da base; mantenha cópias externas apropriadas à operação.

As senhas são armazenadas com scrypt e salt aleatório. As sessões usam tokens aleatórios de 256 bits, hash no banco e cookie HttpOnly/SameSite, com duração de oito horas. Mudanças de senha encerram outras sessões. Tentativas de login são limitadas. A API valida permissões e vínculos independentemente da interface. Todas as gravações de negócio utilizam validação e transações onde necessário.

O servidor escuta apenas em 127.0.0.1 por padrão. Para uso real via celular/rede, publique sob HTTPS com origem configurada; não basta acessar `localhost` do celular. Não houve publicação externa nesta entrega.

`backend/.env.example` lista as variáveis. Copie para `.env` se necessário. Datas operacionais usam `APP_TIMEZONE`, por padrão `America/Sao_Paulo`. Encerramentos e publicações automáticos são verificados a cada minuto e ao carregar os dados.

## Migração para Supabase

O frontend continua usando a mesma API. A mudança é no adaptador de banco do backend. A autenticação permanece no backend desta aplicação; a migração não substitui automaticamente por Supabase Auth.

1. Crie o projeto no Supabase e guarde com segurança a senha do banco definida durante a criação.
2. No painel, abra **Connect → Session pooler → URI**. Para um servidor local em rede IPv4, use a porta `5432`. Este projeto recusa o Transaction pooler da porta `6543`, pois ele é incompatível com o fluxo transacional usado aqui.
3. Abra o **SQL Editor** do Supabase e execute `supabase/migrations/20260909000000_clube_schema.sql`. As tabelas serão criadas no schema privado `clube`, sem exposição pela Data API.
4. Copie `backend/.env.supabase.example` para `backend/.env` e substitua `DATABASE_URL` pela URI copiada. Se a senha contiver caracteres reservados em URL, use a versão codificada na URI. O arquivo `.env` é ignorado pelo Git.
5. Execute `npm run supabase:check`. O resultado deve informar PostgreSQL acessível e listar as contagens das tabelas.
6. Se já houver dados no SQLite, faça backup, pare as gravações, habilite temporariamente `SQLITE_PATH` e `CONFIRM_MIGRATION=yes` no `.env` e execute `npm run supabase:migrate`. O destino deve estar sem registros. A cópia usa uma transação, preserva IDs, hashes de senha, alocações, snapshots e resultados, e confere a quantidade por tabela. Sessões não são migradas.
7. Remova `CONFIRM_MIGRATION` depois da cópia, inicie com `npm start` e confira `/api/health`: o campo `database` deve retornar `postgres`.
8. Confira login, permissões, histórico e um fluxo completo de avaliação antes de liberar o uso. Até essa validação, conserve o SQLite original sem novas gravações.

Enquanto o servidor continuar somente neste computador, mantenha `NODE_ENV=development`, `HOST=127.0.0.1` e `APP_ORIGIN=http://localhost:3001`. Quando o servidor também for publicado, altere para `NODE_ENV=production`, `HOST=0.0.0.0`, `APP_ORIGIN=https://seu-dominio` e coloque um proxy HTTPS na frente da aplicação.

Ative **Enforce SSL on incoming connections** no painel do Supabase. Se o plano e a rede permitirem, restrinja o acesso ao banco ao IP público do servidor local. Atenção: IP residencial dinâmico exige atualização dessa regra quando o endereço mudar. Para uma validação TLS explícita por CA, baixe o certificado do projeto e informe seu caminho em `PGSSL_CA`.

As tabelas PostgreSQL ficam no schema privado `clube`, fora dos schemas normalmente expostos pela Data API do Supabase. Não exponha esse schema para anon/authenticated nem envie a conexão do banco ao frontend. A conexão usa validação TLS. A credencial pertence apenas ao backend.

O adaptador valida TLS, aplica tempos-limite de conexão e consulta, identifica a aplicação no PostgreSQL e impede o uso acidental do pooler transacional. A conexão a um projeto Supabase real precisa ser validada quando as credenciais estiverem disponíveis.

## Estrutura

```
backend/src/app.ts          API, autenticação, permissões e operações
backend/src/domain.ts       Validações, regras e cálculo de ranking
backend/src/db.ts           Schema e adaptadores SQLite/PostgreSQL
backend/src/migrate.ts      Cópia transacional para Supabase
backend/test/               Testes de integração e domínio
frontend/src/app/           Telas funcionais e componentes compartilhados
frontend/src/components/    Componentes visuais preservados do frontend original
scripts/dev.mjs             Inicialização conjunta para desenvolvimento
```

O histórico Git anterior foi preservado. Os testes e a demonstração de validação são executados em bancos separados, sem inserir credenciais de teste na base definitiva.
