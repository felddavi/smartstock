---
name: seguranca
description: Segurança prática no Smart Stock: validação, consultas, credenciais, CORS e autenticação quando solicitada. Usar ao tocar em dados, permissões ou configuração.
---

# Segurança Smart Stock

## Regras
- Valide entradas no backend com Bean Validation em DTOs; validação React melhora UX, mas não substitui validação do servidor.
- Não monte SQL/JPQL por concatenação; use Spring Data ou parâmetros nomeados.
- Nunca adicione entidade JPA a novo `@RequestBody`; preserve os contratos existentes.
- `application.properties` usa `${DB_USERNAME}` e `${DB_PASSWORD}`. Não grave credenciais em código ou arquivos versionados.
- Não implemente autenticação, JWT ou Spring Security sem tarefa explícita; não invente autenticação manual.
- Regras de saldo ficam no Service e em transação: quantidade de movimentação positiva e saída não deixa estoque negativo.
- `@CrossOrigin(origins = "*")` é risco conhecido no projeto; antes de qualquer ambiente fora do local, restrinja à origem React via configuração. Não adote `*` como padrão.
- Não retorne stack trace nem detalhes internos; preserve o formato de erro existente.
- Em React, não renderize conteúdo não confiável com `dangerouslySetInnerHTML`; não armazene tokens em `localStorage`.

## Limites
- Não adicione dependências ou enfraqueça proteções existentes sem pedido e confirmação.
- Em revisão, reporte achados com severidade, trecho afetado e correção sugerida.
