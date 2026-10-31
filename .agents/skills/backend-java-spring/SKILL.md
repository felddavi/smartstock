---
name: backend-java-spring
description: API REST com Java 21 e Spring Boot 4.1.1: camadas, DTOs, validação, exceções, JPA e regras de negócio. Usar ao alterar o backend.
---

# Backend Smart Stock

## Estrutura existente
- Pacotes em `com.smartstock.backend`: `controller`, `service`, `repository`, `model` e `dto`. Siga os arquivos próximos como referência.
- Use injeção por construtor; não introduza `@Autowired` em campos.
- Configuração em `src/main/resources/application.properties`; credenciais via `${DB_USERNAME}` e `${DB_PASSWORD}`.
- Rotas existentes: `/api/produtos` e `/api/movimentacoes`, sem versão. Preserve contratos e regras já consumidos pelo frontend.

## Regras para código novo solicitado
- Controller valida entrada e delega regra ao Service; Service concentra negócio e transações; Repository acessa dados.
- Use DTOs para payloads; não receba entidade JPA diretamente no `@RequestBody`.
- Boot 4: starter web `spring-boot-starter-webmvc`; Jackson 3 usa `tools.jackson` (consulte documentação oficial se houver dúvida).
- JPA: enum com `@Enumerated(EnumType.STRING)`; chave `Long` com `GenerationType.IDENTITY`; valores monetários `BigDecimal` com `precision=10, scale=2`.
- Movimentação: quantidade positiva e saída não pode deixar saldo negativo; siga os tipos e motivos existentes.

## Limites
- Não adicione dependências nem mude rotas, contratos ou regras sem pedido explícito e confirmação quando necessário.
- `/api/v1`, paginação obrigatória, `ProblemDetail` e OpenAPI são direções futuras; só adote em tarefa explícita.
