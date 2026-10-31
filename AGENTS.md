# Regras do Projeto (sempre ativas)

## Stack e fluxo
- Java 21, Spring Boot 4.1.1, Maven, API REST, MySQL, React 19, Vite e Axios. Preserve a estrutura e os padrões existentes.
- Trabalhe uma tarefa por vez, conforme o checklist do projeto; só passe para a próxima depois que a atual estiver implementada, testada e validada por mim.
- Em demanda ainda sem escopo fechado, planeje a menor entrega, etapas incrementais e critérios de aceite; não implemente durante o planejamento.
- Se faltar informação essencial, faça até 3 perguntas objetivas. Para mudanças em mais de 3 arquivos, apresente plano de até 5 linhas e aguarde confirmação.
- Não altere `pom.xml` ou `package.json` sem avisar; dependência nova exige confirmação.
- Ao terminar, informe arquivos alterados, removidos e como validar.

## Comandos existentes
- Backend, em `smart-stock-backend`: `mvnw.cmd test` e `mvnw.cmd spring-boot:run`.
- Frontend, em `smart-stock-frontend`: `npm run dev`, `npm run lint` e `npm run build`.

## Código
- KISS/YAGNI; métodos coesos; nomes claros; sem números mágicos.
- Prefira imutabilidade (`final`, `record`, `const`) quando compatível com os padrões existentes.
- Nunca engula exceções nem altere regras de negócio ao refatorar.
- Em desempenho, priorize I/O, queries N+1 e re-renders em loop; evite otimização prematura.

## Skills (carregue apenas a necessária)
- `backend-java-spring`: API, camadas, DTOs, validação e regras de negócio.
- `frontend-react`: componentes, telas, estilos e consumo da API.
- `testes-qa`: testes Java/React, critérios de aceite e cenários de falha.
- `revisor-auditor`: auditoria somente leitura e relatório de achados.
- `seguranca`: validação, autenticação, permissões, segredos e CORS.
