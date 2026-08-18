# Criação de aluno no painel do coach

Este registro documenta uma sessão de QA do fluxo de criação de aluno no
painel web do coach.

## Objetivo

Confirmar que o coach consegue criar um aluno pelas três etapas do formulário e
que o sistema impede a criação quando o e-mail informado já está cadastrado.

## Cenário positivo

1. Entrar no painel do coach.
2. Abrir “Cadastrar aluno”.
3. Verificar que “Próximo” começa bloqueado.
4. Informar nome e e-mail e avançar.
5. Gerar usuário e senha provisórios.
6. Avançar para o acompanhamento e criar o aluno.
7. Confirmar a mensagem de sucesso, as credenciais e a entrada do aluno na lista.

Resultado esperado: o aluno é criado e a lista passa a exibi-lo.

## Cenário negativo: e-mail duplicado

1. Repetir o fluxo usando um e-mail que já pertence a um aluno.
2. Preencher as três etapas normalmente.
3. Selecionar “Criar aluno”.

Resultado esperado: a criação é bloqueada, o erro é informado, a tela de
sucesso não aparece e a lista permanece sem um novo aluno.

O e-mail inválido não foi usado como cenário negativo porque não é a regra de
negócio definida para este fluxo. O foco ficou na duplicidade, que precisa ser
impedida antes de criar outro acesso.

## Evidências

- [Teste Cypress](./coach-create-student.cy.ts)
- [Vídeo dos dois cenários](./coach-create-student.cy.ts.mp4)

Os dados utilizados são fictícios e as respostas de API são simuladas no
navegador para manter a execução isolada, repetível e sem dados de clientes.
