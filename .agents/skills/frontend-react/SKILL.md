---
name: frontend-react
description: Interface do Smart Stock com React 19, Vite, Axios e CSS existente. Usar ao alterar componentes, telas, navegação ou integração com a API.
---

# Frontend Smart Stock

## Padrões existentes
- Preserve a organização atual; não imponha pastas `pages`, `components`, `hooks` ou `services` nem refatore sem tarefa explícita.
- React 19, Vite e Axios. Estilos globais em `src/App.css` e `src/index.css`; mantenha classes e tokens existentes.
- A navegação atual usa estado no componente principal: `abaAtiva` com `'estoque'` e `'pdv'`, além de `.nav-tabs`.
- Reutilize classes existentes: `.nav-tabs`, `.stock-table`, `.action-group`, `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger-outline`, `.status-badge`, `.row-alerta`, `.row-zerado`, `.modal-backdrop` e `.modal-card`.
- Preserve os tokens de cor atuais (`--primary: #2563eb`, `--success: #16a34a`, `--warning-bg: #fef3c7`, `--warning-text: #92400e`, `--danger: #dc2626`, `--danger-text: #991b1b`) definidos em `src/index.css`.

## Regras para mudanças solicitadas
- Mantenha HTML semântico, labels associados, botões com `type` explícito e foco visível por teclado.
- Preserve chamadas existentes para `/api/produtos` e `/api/movimentacoes`; não mova busca local para o backend sem pedido.
- Em erros Axios, use o formato atual `erro.response?.data || erro.message` e apresente feedback claro.
- Após operações que alteram estoque, recarregue produtos com a função existente `carregarProdutos()`.
- Use chaves estáveis nas listas e mantenha os layouts responsivos já existentes.

## Limites
- Não adicione bibliotecas, roteamento ou estrutura nova sem tarefa explícita e confirmação quando necessária.
- Testes automatizados React: proponha e aguarde confirmação se o projeto não tiver ferramenta instalada.
