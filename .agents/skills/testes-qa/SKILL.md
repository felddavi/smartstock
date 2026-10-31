---
name: testes-qa
description: Testes e validação de mudanças no Smart Stock com Spring Boot 4, JUnit, Mockito, MockMvc e React/Vite. Usar ao validar lógica, endpoints, interface ou bugs.
---

# Testes & QA Smart Stock

## Backend
- Para regras de Service, use JUnit 5 e Mockito sem subir contexto Spring; teste o comportamento e efeitos no repositório.
- Em `MovimentacaoService`, cubra: entrada soma saldo e registra histórico; saída válida subtrai e registra; saída acima do saldo falha sem persistir; quantidade inválida e produto inexistente falham.
- Boot 4: `@WebMvcTest` vem de `org.springframework.boot.webmvc.test.autoconfigure`; `@MockBean` e `@SpyBean` foram removidos, use `@MockitoBean`.
- Para Controller, use `@WebMvcTest` e valide status, corpo e payload inválido.
- Execute no Windows, em `smart-stock-backend`: `mvnw.cmd test`.

## Frontend
- Use apenas verificações disponíveis em `smart-stock-frontend`: `npm run lint` e `npm run build`.
- Confira manualmente os fluxos visíveis afetados: estados de estoque, movimentação, ajuste de inventário e navegação entre `'estoque'` e `'pdv'`.
- Não afirme teste de interface/API se apenas lint ou build foram executados.

## Limites
- Testes automatizados React ou Testcontainers: proponha e aguarde confirmação se exigirem dependência ou configuração ausente.
- Não altere nem enfraqueça testes para mascarar falhas; priorize regras de negócio e caminhos de erro.
