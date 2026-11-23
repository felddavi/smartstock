# Contexto do Projeto — Smart Stock

Documento rápido de referência para alinhar agentes e desenvolvedores sobre o estado atual do **Smart Stock**. Sempre priorize as regras de [`AGENTS.md`](../AGENTS.md), as skills em [`.agents/skills/`](../.agents/skills/) e o checklist da etapa ativa.

---

## 1. Visão Geral
O **Smart Stock** é um MVP full-stack de **Gestão de Estoque e Frente de Caixa (PDV)** para varejo, focado em controle de saldo em tempo real, alertas de estoque crítico, ajuste rápido de inventário (balanço) e vendas atômicas com histórico auditável.

---

## 2. Stack e Arquitetura Atual

- **Backend (`smart-stock-backend/`):**
  - Java 21, Spring Boot 4.1.1 (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`), Lombok e SpringDoc OpenAPI 3 (`/swagger-ui.html`).
  - Pacote base: `com.smartstock.backend` (`controller`, `service`, `repository`, `model`, `model.enums`, `dto`).
  - Banco de dados: **MySQL 8.4** em execução local/Docker (configurado via variáveis `DB_USERNAME`, `DB_PASSWORD` e `SPRING_DATASOURCE_URL`) e **H2 em memória** exclusivo para a suíte de testes (`src/test/resources/application.properties`).
- **Frontend (`smart-stock-frontend/`):**
  - React 19, Vite 8, Axios e Oxlint.
  - Comunicação com a API centralizada em `src/api.js` usando **caminho relativo** (`baseURL: ''`, rotas `/api/...`).
  - Em desenvolvimento (`npm run dev`), o proxy do `vite.config.js` redireciona `/api` para `http://localhost:8080`.
- **Infraestrutura Docker (`docker-compose.yml`):**
  - Serviços: `mysql` (`mysql:8.4` com volume `mysql_data` e healthcheck TCP), `backend` (JRE 21 Alpine, usuário não-root) e `frontend` (Nginx Alpine servindo o build estático e fazendo proxy reverso de `/api/` para `http://backend:8080`).
  - Apenas o Nginx (`frontend`) publica porta no host.

---

## 3. Domínio, Contratos REST e Regras de Negócio

### Produtos (`/api/produtos`)
- **Entidade `Produto`:** `id`, `nome`, `categoria`, `preco` (`BigDecimal(10,2)`), `quantidade`, `estoqueMinimo`.
- **Payload (`ProdutoRequestDTO`):** `nome` (obrigatório), `categoria` (obrigatória), `preco` (`> 0`), `quantidade` (`>= 0`), `estoqueMinimo` (`>= 0`).
- **Status de estoque (regra de domínio):**
  - **Esgotado:** `quantidade <= 0`
  - **Estoque Baixo (Crítico):** `quantidade > 0 && quantidade <= estoqueMinimo`
  - **Normal:** `quantidade > estoqueMinimo`

### Movimentações (`/api/movimentacoes`)
- **Enum `TipoMovimentacao`:**
  - Entradas (somam ao saldo): `ENTRADA_REPOSICAO`, `ENTRADA_DEVOLUCAO`
  - Saídas (subtraem do saldo, bloqueando saldo negativo): `SAIDA_VENDA`, `SAIDA_AVARIA`
- **Atenção ao contrato JSON:**
  - No `POST /api/movimentacoes` (`MovimentacaoRequestDTO`), o campo enviado chama-se **`tipo`** (`{ produtoId, tipo, quantidade, motivo }`).
  - No `GET /api/movimentacoes` (entidade `Movimentacao`), o campo retornado no JSON chama-se **`tipoMovimentacao`** (`{ id, produto, tipoMovimentacao, quantidade, motivo, dataHora }`).
- **Ajuste Rápido de Inventário / Balanço (RF06):**
  - O operador informa a contagem física contada na prateleira (`inteiro >= 0`).
  - O frontend calcula `diferenca = contagemFisica - saldoAtual`. Se `diferenca < 0`, envia `POST /api/movimentacoes` com `SAIDA_AVARIA`; se `diferenca > 0`, envia com `ENTRADA_REPOSICAO` e `quantidade = |diferenca|`.

### Vendas Atômicas no PDV (`/api/vendas`)
- **Entidades:** `Venda` (`id`, `dataHora`, `valorTotal`, `itens`) e `ItemVenda` (`id`, `venda`, `produto`, `quantidade`, `precoUnitario`, `subtotal`).
- **Contrato:** `POST /api/vendas` recebe `VendaRequestDTO` (`{ itens: [{ produtoId, quantidade }] }`) e retorna `VendaResponseDTO` (`201 Created`) ou mensagem de erro (`400 Bad Request`).
- **Atomicidade (`VendaService.realizarVenda` sob `@Transactional`):**
  1. Rejeita carrinho vazio ou itens com `quantidade <= 0`.
  2. Consolida quantidades de itens repetidos do mesmo produto antes de validar o saldo.
  3. Valida existência e saldo de **todos** os produtos antes de alterar qualquer registro (rollback total se qualquer item falhar).
  4. Congela o `precoUnitario` do momento da venda em `ItemVenda`, baixa o saldo de `Produto` e gera um registro em `Movimentacao` (`SAIDA_VENDA`, motivo `"Venda PDV #<id>"`) para cada item.
- **No Frontend:** os cálculos monetários do carrinho usam **centavos inteiros** (`Math.round(preco * 100)`) para evitar erros de ponto flutuante.

---

## 4. Comandos de Validação

- **Backend** (em `smart-stock-backend/`):
  - Rodar os 55 testes automatizados (H2): `.\mvnw.cmd test`
  - Subir localmente: `.\mvnw.cmd spring-boot:run`
- **Frontend** (em `smart-stock-frontend/`):
  - Lint: `npm run lint`
  - Build de produção: `npm run build`
  - Servidor dev: `npm run dev`
- **Docker** (na raiz):
  - Subir stack completa: `docker compose up --build -d`
  - Parar mantendo dados: `docker compose down`
