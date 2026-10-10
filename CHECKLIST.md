# CHECKLIST TAREFAS IMS

---

### 🟢 Etapa 1: Backend (Spring Boot)

* [X] **1.1. Atualizar a Entidade `Produto`**
  * Adicionar o campo `estoqueMinimo` (`Integer`, não nulo) no arquivo `Produto.java`. *(Conforme acabamos de estruturar)*.

* [X] **1.2. Criar a Enum de Motivos/Tipos de Movimentação**
  * Criar um arquivo `TipoMovimentacao.java` (ou `MotivoMovimentacao.java`) para padronizar os tipos (ex: `ENTRADA_REPOSICAO`, `ENTRADA_DEVOLUCAO`, `SAIDA_VENDA`, `SAIDA_AVARIA`).

* [X] **1.3. Criar a Entidade `MovimentacaoEstoque`**
  * Criar `Movimentacao.java` com os campos: `id`, `produto` (relacionamento `@ManyToOne`), `tipoMovimentacao`, `quantidade`, `motivo` e `dataHora` (`LocalDateTime`).

* [X] **1.4. Criar o `MovimentacaoRepository`**
  * Interface padrão estendendo `JpaRepository<Movimentacao, Long>` para salvar e buscar o histórico.
  * Métodos de consulta derivados adicionados:
    * `findAllByOrderByDataHoraDesc()`: busca o histórico completo ordenado da movimentação mais recente para a mais antiga.
    * `findByProdutoId(Long produtoId)`: busca o histórico de movimentações filtrado por um produto específico.

* [X] **1.5. Criar a Regra de Negócio no `MovimentacaoService`**
  * Implementar a lógica onde, ao registrar uma movimentação:
    * Se for entrada, soma a quantidade no estoque do `Produto`.
    * Se for saída, subtrai a quantidade do estoque do `Produto` (com validação para o estoque não ficar negativo).
    * Salva a movimentação vinculada ao produto.
  * Métodos de listagem do histórico (`listarHistorico` e `listarHistoricoPorProduto`) implementados.

* [X] **1.6. Criar o `MovimentacaoController`**
  * Expor a rota `POST /api/movimentacoes` recebendo DTO (`MovimentacaoRequestDTO`) com resposta HTTP 201 CREATED (e 400 em caso de erro de validação).
  * Rotas `GET /api/movimentacoes` e `GET /api/movimentacoes/produto/{produtoId}` implementadas para consulta do histórico.

* [X] **1.7. Padronização com DTO e Validação (Bean Validation)**
  * Criado `ProdutoRequestDTO` com validações (`@NotBlank`, `@NotNull`, `@Min`, `@DecimalMin`).
  * Atualizados `ProdutoService` e `ProdutoController` (POST e PUT) desacoplando a entidade `Produto` do payload da API.

---

### 🔵 Etapa 2: Frontend (React / Vite)

* [X] **2.1. Atualizar o Formulário de Cadastro de Produtos (`App.jsx` ou componente de cadastro)**
  * Adicionar o campo de input para o **Estoque Mínimo** junto aos campos de Nome, Categoria, Preço e Quantidade inicial.
  * Campo adicionado ao estado (`estoqueMinimo`), enviado no payload `POST` para o backend e exibido como coluna na tabela de listagem.

* [X] **2.2. Implementar Alerta Visual de Ruptura na Tabela**
  * Na listagem de produtos, comparar `quantidade <= estoqueMinimo`.
  * Adicionado banner de alerta de reposição no topo informando total de itens críticos.
  * Adicionada coluna "Status" com badges visuais (`✅ Normal`, `⚠️ Estoque Baixo`, `⛔ Esgotado`) e destaque de cor de fundo nas linhas afetadas.

* [X] **2.3. Criar Modal ou Fluxo de "Movimentação de Estoque"**
  * Substituir os botões simples de `+1` / `-1` por um botão de **Movimentar** que abre um pequeno modal/formulário permitindo escolher:
    * Se é **Entrada (Reposição)** ou **Saída (Avaria/Perda)**.
    * A quantidade a ser movimentada.
  * Fazer a requisição `POST` para o endpoint de movimentações que criamos no backend (`/api/movimentacoes`).
  * Modal responsivo com feedback de sucesso/erro e atualização automática dos saldos e alertas visuais.

---

### 🛒 Etapa 3: Futuro Próximo (Tela 2 - PDV / Caixa)

* [ ] **3.1. Criar a Aba/Rota de PDV no Frontend**
  * Desenvolver a interface limpa de caixa (busca rápida de produtos e carrinho).

* [ ] **3.2. Integrar a Finalização de Venda**
  * Enviar os itens vendidos consumindo o endpoint de movimentação com o motivo de `VENDA`, dando baixa automática no estoque de forma integrada.
