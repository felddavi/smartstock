# 📦 Smart Stock

[![Deploy na Vercel](https://img.shields.io/badge/Vercel-Deploy_Ativo-black?style=for-the-badge&logo=vercel)](https://smartstock-pdv.vercel.app/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![REST API](https://img.shields.io/badge/REST_API-OpenAPI_3-0052CC?style=for-the-badge&logo=fastapi&logoColor=white)](https://swagger.io/)
[![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Testes Automatizados](https://img.shields.io/badge/Testes-JUnit_5_%26_Mockito-success?style=for-the-badge&logo=junit5)](https://github.com/)

> Gestão de estoque e frente de caixa (PDV) para o varejo, em uma única aplicação web.

O Smart Stock reúne o cadastro de produtos, o controle de saldo e a venda no balcão em um só lugar.
Cada venda, reposição ou ajuste atualiza o estoque na hora e deixa um registro auditável,
que pode ser consultado com filtros e exportado em PDF.

**Destaques**

- **Venda atômica:** a venda baixa o estoque, congela o preço de cada item e registra as movimentações
  em uma única transação. Se um item falhar, nada é gravado.
- **Alertas de ruptura:** o painel inicial destaca os produtos no limite do estoque mínimo ou esgotados.
- **Histórico auditável:** toda alteração de saldo gera uma movimentação, filtrável por tipo e exportável em PDF.
- **Ajuste de inventário:** a contagem física é comparada com o saldo do sistema, e a diferença vira uma
  movimentação compensatória.
- **Pronto para Docker:** MySQL, API e frontend sobem juntos com um único comando.

---

## 🌐 Demonstração Online

A aplicação está disponível e hospedada publicamente:

- **Frontend (PDV & Gestão de Estoque):** [https://smartstock-pdv.vercel.app/](https://smartstock-pdv.vercel.app/)

> Você pode navegar pela interface, simular adição de produtos ao carrinho, calcular subtotais e testar os filtros de estoque e busca em tempo real.

---

## 🎬 Demonstração

|                                Tela Início                                |                              Tela Produtos                              |
| :-----------------------------------------------------------------------: | :---------------------------------------------------------------------: |
|    <img src="docs/img/TelaInicio.png" alt="Tela Início" width="420" />    | <img src="docs/img/TelaProdutos.png" alt="Tela Produtos" width="420" /> |
|                            **Tela Histórico**                             |                           **Tela Caixa PDV**                            |
| <img src="docs/img/TelaHistorico.png" alt="Tela Histórico" width="420" /> |  <img src="docs/img/TelaCaixa.png" alt="Tela Caixa PDV" width="420" />  |

---

## 🛠️ Tecnologias Utilizadas

### Backend

- **Linguagem & Framework:** Java 21 & Spring Boot 4.1.1
- **Acesso a Dados:** Spring Data JPA & Hibernate
- **Validação:** Jakarta Bean Validation (`@Valid`, constraints nos DTOs)
- **Documentação da API:** SpringDoc OpenAPI 3 / Swagger UI
- **Build & Dependências:** Apache Maven Wrapper (`mvnw`)

### Frontend

- **Interface:** React 19
- **Build Tool:** Vite
- **Comunicação HTTP:** Axios
- **Ícones:** `lucide-react`
- **Exportação de Relatórios PDF:** `jspdf` & `jspdf-autotable`
- **Qualidade de Código:** Oxlint

### Banco de Dados

- **Aplicação (desenvolvimento e deploy):** MySQL 8.4 (via Docker) / MySQL 8+ (local)
- **Testes automatizados:** H2 em memória, isolado por perfil de teste

### Containers & Proxy Reverso

- **Orquestração:** Docker & Docker Compose (`mysql`, `backend` e `frontend`)
- **Imagens Multi-stage:** Eclipse Temurin 21 (JDK no build / JRE Alpine no runtime) e Node 22 Alpine
- **Servidor Web & Proxy:** Nginx 1.27 Alpine (build estático da SPA + proxy reverso `/api/`)

---

## 📁 Estrutura do Repositório

```text
smartstock/
├── .agents/                    # Diretrizes e skills usadas pelos agentes de IA no desenvolvimento
├── .env.example                # Modelo de variáveis de ambiente para o Docker Compose
├── docker-compose.yml          # Orquestração dos serviços (MySQL 8.4, Backend e Frontend/Nginx)
├── api-requests/               # Coleção de requisições prontas para o Bruno (REST API)
│   └── SmartStock API/
│       ├── Movimentações/
│       ├── Produtos/
│       └── Vendas/
├── docs/                       # Documentação de arquitetura, requisitos e mídias (docs/img)
├── smart-stock-backend/        # API REST Spring Boot (Java 21)
│   ├── Dockerfile              # Build multi-stage (JDK 21 -> JRE 21 Alpine, usuário não-root)
│   ├── .dockerignore
│   ├── src/main/java/          # Controllers, Services, DTOs, Entidades e Repositories
│   └── src/test/java/          # Testes unitários, de controller e de integração
└── smart-stock-frontend/       # Aplicação SPA React (Vite)
    ├── Dockerfile              # Build multi-stage (Node 22 Alpine -> Nginx 1.27 Alpine)
    ├── nginx.conf              # Fallback SPA e proxy reverso de /api/ para backend:8080
    ├── .dockerignore
    └── src/
        ├── api.js              # Cliente Axios centralizado com baseURL relativa
        ├── App.jsx             # Shell principal, estado global e modais
        ├── App.css / index.css # Design System Cloud e estilos globais
        ├── components/         # Topbar, Sidebar, ToastContainer, MovimentacaoModal e AjusteModal
        ├── utils/              # Utilitários (estoqueStatus.js e mensagemErro.js)
        └── views/              # Telas: InicioView, ProdutosView, HistoricoView e PdvView
```

> O projeto foi desenvolvido com apoio de agentes de IA. A pasta `.agents/` guarda as regras e
> skills que orientam esse fluxo. Toda alteração é validada com testes e revisão manual.

---

## 🚀 Como Executar o Projeto

### Executar com Docker (Recomendado)

A forma mais rápida de subir toda a stack (**MySQL 8.4 + Backend + Frontend/Nginx**) com um único comando.

#### Pré-requisitos

- **Docker Desktop** (com **Docker Compose** habilitado).

#### 1. Configure as variáveis de ambiente

Na raiz do projeto, copie o arquivo de exemplo para criar o seu `.env`:

```bash
# Linux / macOS (Bash):
cp .env.example .env

# Windows (PowerShell):
Copy-Item .env.example .env
```

> **Importante:**
>
> - **Não use `DB_USERNAME=root`**, pois a imagem oficial do MySQL 8.4 rejeita `MYSQL_USER=root` na inicialização (o `.env.example` já vem com `smartstock_user`).
> - O arquivo `.env` já está listado no `.gitignore` e nunca deve ser commitado com senhas reais.

#### 2. Suba os containers

```bash
docker compose up --build -d
```

O Compose inicia o MySQL com healthcheck, aguarda o banco ficar saudável para subir o backend Spring Boot e publica apenas o frontend Nginx no host.

#### 3. Acesse a aplicação

- **Aplicação Web (PDV & Estoque):** [http://localhost](http://localhost) (ou `http://localhost:<FRONTEND_PORT>`, caso altere `FRONTEND_PORT` no `.env`).

#### 4. Parar ou limpar o ambiente

```bash
# Parar e remover os containers mantendo os dados do banco (volume preservado):
docker compose down

# Parar, remover os containers e apagar também os volumes/dados do MySQL:
docker compose down -v
```

---

### Executar Localmente (sem Docker)

#### Pré-requisitos

- **Java 21** instalado e configurado no `PATH`.
- **Node.js 20+** e **npm** instalados.
- **MySQL 8+** ativo localmente na porta padrão `3306`.

#### 1. Backend (`smart-stock-backend`)

##### Variáveis de ambiente

O backend conecta-se ao MySQL usando `DB_USERNAME` e `DB_PASSWORD`.

**Windows (PowerShell):**

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "sua_senha_aqui"
```

**Linux / macOS (Bash):**

```bash
export DB_USERNAME="root"
export DB_PASSWORD="sua_senha_aqui"
```

> **Nota:** o banco `smartstock` é criado automaticamente caso não exista (`createDatabaseIfNotExist=true`).

##### Executar

```bash
cd smart-stock-backend
# Windows:
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```

Com o backend rodando localmente, a API e a documentação interativa ficam disponíveis em `http://localhost:8080`:

- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

#### 2. Frontend (`smart-stock-frontend`)

```bash
cd smart-stock-frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

### Endereço da API e Proxy

O frontend centraliza o cliente HTTP em `smart-stock-frontend/src/api.js` e faz todas as chamadas por **caminho relativo (`/api/...`)**, eliminando URLs fixas e problemas de CORS:

- **No Docker:** o **Nginx** (`smart-stock-frontend/nginx.conf`) serve o build estático do React e faz proxy reverso de `/api/` para o container `http://backend:8080`, mantendo o MySQL e o backend isolados na rede interna (sem portas expostas no host).
- **No desenvolvimento local (`npm run dev`):** o proxy configurado no **Vite** (`smart-stock-frontend/vite.config.js`) encaminha automaticamente as requisições `/api` para `http://localhost:8080`.

---

## 🔌 Endpoints da API

Documentação interativa completa em `/swagger-ui.html`. Resumo por recurso:

<details open>
<summary><strong>📦 Produtos</strong> — <code>/api/produtos</code></summary>

|  Método  | Rota                         | Descrição                              |
| :------: | :--------------------------- | :------------------------------------- |
|  `GET`   | `/api/produtos`              | Lista todos os produtos                |
|  `GET`   | `/api/produtos/{id}`         | Busca um produto pelo ID               |
|  `POST`  | `/api/produtos`              | Cadastra um novo produto               |
|  `PUT`   | `/api/produtos/{id}`         | Atualiza os dados de um produto        |
| `PATCH`  | `/api/produtos/{id}/estoque` | Atualiza o saldo de estoque do produto |
| `DELETE` | `/api/produtos/{id}`         | Exclui um produto                      |

</details>

<details open>
<summary><strong>🔄 Movimentações</strong> — <code>/api/movimentacoes</code></summary>

| Método | Rota                                     | Descrição                                                           |
| :----: | :--------------------------------------- | :------------------------------------------------------------------ |
| `GET`  | `/api/movimentacoes`                     | Lista o histórico de movimentações                                  |
| `POST` | `/api/movimentacoes`                     | Registra uma movimentação (entrada, saída, avaria, devolução, etc.) |
| `GET`  | `/api/movimentacoes/produto/{produtoId}` | Histórico de movimentações de um produto                            |

</details>

<details open>
<summary><strong>🛒 Vendas</strong> — <code>/api/vendas</code></summary>

| Método | Rota               | Descrição                                                                    |
| :----: | :----------------- | :--------------------------------------------------------------------------- |
| `POST` | `/api/vendas`      | Realiza uma venda atômica (valida itens, baixa estoque e gera movimentações) |
| `GET`  | `/api/vendas`      | Lista todas as vendas                                                        |
| `GET`  | `/api/vendas/{id}` | Busca uma venda pelo ID, com seus itens                                      |

</details>

---

## 🧪 Testes e Qualidade de Código

### Backend (Testes Automatizados)

A suíte roda de forma autônoma e rápida com **H2 em memória**, sem precisar de MySQL:

- **Testes unitários de Service (JUnit 5 + Mockito):** regras de negócio, bloqueios de estoque, cálculo de totais e integridade das movimentações.
- **Testes de Controller (`@WebMvcTest`):** payloads, status HTTP (200, 201, 400, 404) e contratos REST.
- **Testes de integração (`@SpringBootTest` com H2):** transações `@Transactional` e rollback atômico em operações compostas de venda.

```bash
cd smart-stock-backend
.\mvnw.cmd test
```

### Frontend (Lint & Build)

O frontend ainda não possui suíte de testes automatizados; a validação é feita via lint (`oxlint`) e build de produção (`vite build`):

```bash
cd smart-stock-frontend
npm run lint
npm run build
```

---

## 📬 Testando a API via Bruno

A coleção está em `api-requests/SmartStock API/`:

1. Abra o [Bruno](https://www.usebruno.com) e escolha **Open Collection**.
2. Selecione a pasta `api-requests/SmartStock API`.
3. Use as pastas **Produtos**, **Movimentações** e **Vendas**.

---

## 🖥️ Módulos e Fluxo das Telas

Navegação via **Topbar fixa** (`SMARTSTOCK`) e **Sidebar recolhível** com feedback por Toast:

- **Tela 1 — Início:** 4 KPIs em tempo real (total de produtos, valor estimado em estoque em centavos, itens críticos e saídas por avaria) e tabela de atenção rápida para produtos com `quantidade <= estoqueMinimo`.
- **Tela 2 — Produtos:** filtros combinados (nome, categoria dinâmica e status `Normal`, `Estoque Baixo` ou `Esgotado`), **Drawer lateral** (`+ Novo Produto`) para cadastro e ações de movimentação, ajuste de inventário/balanço e exclusão.
- **Tela 3 — Histórico:** auditoria das movimentações com filtros por direção (`Entradas`/`Saídas`), tipo e nome do produto, além de exportação em PDF (`jspdf` + `jspdf-autotable`) dos registros filtrados.
- **Tela 4 — Caixa (PDV):** catálogo filtrável, carrinho com cálculo em centavos, trava de saldo no botão `+`, preço congelado no item e venda atômica (`POST /api/vendas`).

---

## 🧭 Decisões de Arquitetura

- **Venda em um único endpoint atômico:** O frontend envia o carrinho inteiro em uma requisição, e o backend valida todos os itens _antes_ de alterar qualquer estado, dentro de uma transação. Assim, uma falha no meio nunca deixa o estoque baixado pela metade.
- **Preço congelado no item da venda:** O valor unitário é copiado para o `ItemVenda` no momento da compra, garantindo que reajustes posteriores de preço no produto não alterem o histórico e balanço fiscal passado.
- **Agrupamento de itens repetidos:** Se houver repetições de um mesmo produto no payload, as quantidades são consolidadas antes da validação de estoque, impedindo fraudes ou inconsistências de concorrência.
- **Rastreabilidade total:** Toda alteração de saldo gera uma `Movimentacao`, garantindo auditoria completa (entradas, saídas, perdas e vendas).
- **Regras no backend com UX reativa no frontend:** Travas visuais melhoram a experiência do operador, mas o backend é quem assegura a integridade das regras.
- **Isolamento de DTOs na borda da API:** Entidades de persistência JPA não são expostas nas rotas REST, prevenindo vazamentos de estrutura e loops de serialização.
- **H2 isolado para a suíte de testes:** Permite que qualquer desenvolvedor ou esteira de CI execute os testes em segundos sem exigir um container ou daemon de banco ativo.

---

## ⚠️ Limitações e Próximos Passos

- **Autenticação e Autorização:** Hoje os endpoints estão públicos na rede local. O próximo passo é introduzir Spring Security com JWT e controle de permissões por perfil.
- **Gerenciamento de Schema:** Migrar de `ddl-auto=update` para controle de migrações versionadas via **Flyway** e validação de schema (`ddl-auto=validate`).
- **Testes no Frontend:** Implementar suíte de testes de componentes com Vitest e React Testing Library.
- **Testcontainers:** Executar suíte de integração avançada contra uma instância real de MySQL efêmero em Docker.
- **CI/CD:** Automatizar a execução de lint, build e testes no GitHub Actions a cada commit.
- **Otimização de Bundle (PDF sob demanda):** A biblioteca `jspdf` aumenta o tamanho do bundle inicial do frontend; um próximo passo é carregá-la sob demanda (dynamic `import()`) apenas quando o usuário exportar o relatório.

---

## 👤 Autor

**Davi Feldmann** · [LinkedIn](https://br.linkedin.com/in/felddavi) · [GitHub](https://github.com/felddavi)

Feedbacks e sugestões são bem-vindos nas [issues](https://github.com/felddavi/smartstock/issues).

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). Copyright © 2026 Davi Feldmann.
