# Portfólio de QA — Apex

Esta coleção reúne testes de software organizados por fluxo do produto.

## Repositórios

- [Testes gerais](https://github.com/felipemsilva2/apex-qa-general)
- [Login e autenticação](https://github.com/felipemsilva2/apex-qa-login)
- [Pagamento e checkout](https://github.com/felipemsilva2/apex-qa-payment)
- [Trial e controle de acesso](https://github.com/felipemsilva2/apex-qa-trial-access)
- [Regressão](https://github.com/felipemsilva2/apex-qa-regression)
- [Performance](https://github.com/felipemsilva2/apex-qa-performance)

## Primeira entrega

- 49 testes unitários e de contrato aprovados.
- 4 cenários E2E aprovados com Cypress.
- Cenários cobertos: navegação pública, login inválido, login válido e trial preservado durante checkout Pix pendente.
- Os testes E2E usam respostas simuladas. Não há credenciais, cobranças ou dados reais.

Os testes são escritos para demonstrar comportamento observável, critérios de aceite e evidências de execução.

## Fluxo destacado: criação de aluno no painel do coach

Este fluxo mostra como uma pessoa cria um aluno no painel e como o sistema
reage quando o e-mail já pertence a outro aluno.

- [Roteiro de QA e critérios observados](flows/coach-student-creation/README.md)
- [Cenário Cypress](flows/coach-student-creation/coach-create-student.cy.ts)
- [Vídeo da execução](flows/coach-student-creation/coach-create-student.cy.ts.mp4)
