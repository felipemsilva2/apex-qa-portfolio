describe("Painel do coach — criação de aluno", () => {
  const coachId = "qa-coach-id";
  const tenantId = "qa-tenant-id";
  const existingClientId = "qa-existing-client-id";
  const createdClientId = "qa-created-client-id";

  const coachProfile = {
    id: coachId,
    tenant_id: tenantId,
    role: "coach",
    full_name: "Coach de Teste",
    email: "coach@example.com",
    phone: "11999999999",
    cpf: "52998224725",
    avatar_url: null,
    has_seen_tour: true,
    is_tenant_admin: true,
    is_complimentary: false,
    trial_end: null,
    subscription_status: "active",
    created_at: "2099-01-01T00:00:00.000Z",
    updated_at: "2099-01-01T00:00:00.000Z",
  };

  const tenant = {
    id: tenantId,
    business_name: "Academia QA",
    plan_tier: "pro",
    subscription_status: "active",
    trial_end: null,
    current_period_end: "2099-12-31T00:00:00.000Z",
    is_complimentary: false,
    subscription_test_blocked: false,
    trial_used: true,
    staff_names: [],
    has_seen_tour: true,
    logo_url: null,
    primary_color: null,
    secondary_color: null,
    terminology: null,
    created_at: "2099-01-01T00:00:00.000Z",
    updated_at: "2099-01-01T00:00:00.000Z",
  };

  const createClient = (overrides: Record<string, unknown> = {}) => ({
    id: existingClientId,
    tenant_id: tenantId,
    user_id: "qa-existing-user-id",
    full_name: "Aluno Existente",
    email: "existing@example.com",
    phone: null,
    avatar_url: null,
    birth_date: null,
    gender: null,
    current_weight: null,
    target_weight: null,
    height: null,
    status: "active",
    assigned_coach_id: coachId,
    notes: null,
    water_goal: null,
    weekly_checkin_limit: null,
    workout_review_frequency_days: 7,
    created_by_name: "Coach de Teste",
    username: null,
    provisional_password: null,
    created_at: "2099-01-01T00:00:00.000Z",
    updated_at: "2099-01-01T00:00:00.000Z",
    ...overrides,
  });

  function mockCoachSession(mode: "sucesso" | "duplicidade" = "sucesso") {
    let authenticated = false;
    let clients = [createClient()];

    cy.intercept("GET", "**/functions/v1/auth-proxy*", (request) => {
      request.reply({
        statusCode: 200,
        body: {
          success: authenticated,
          session: authenticated
            ? {
                user: {
                  id: coachId,
                  email: "coach@example.com",
                  email_confirmed: true,
                },
              }
            : null,
          error: null,
        },
      });
    }).as("sessionCheck");

    cy.intercept("POST", "**/auth/v1/token?grant_type=password", (request) => {
      authenticated = true;
      request.reply({
        statusCode: 200,
        body: {
          access_token: "qa-access-token",
          refresh_token: "qa-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: coachId,
            email: "coach@example.com",
            email_confirmed_at: "2099-01-01T00:00:00.000Z",
          },
        },
      });
    }).as("passwordLogin");

    cy.intercept("GET", "**/rest/v1/**", { statusCode: 200, body: [] });
    cy.intercept("POST", "**/rest/v1/**", { statusCode: 200, body: {} });

    cy.intercept("GET", "**/rest/v1/profiles*", (request) => {
      const url = decodeURIComponent(request.url);

      if (url.includes("select=*") && url.includes(`id=eq.${coachId}`)) {
        request.reply({ statusCode: 200, body: coachProfile });
        return;
      }

      request.reply({
        statusCode: 200,
        body: [
          {
            id: coachId,
            full_name: coachProfile.full_name,
            role: coachProfile.role,
            avatar_url: null,
            is_tenant_admin: true,
          },
        ],
      });
    }).as("profilesQuery");

    cy.intercept("GET", "**/rest/v1/tenants*", {
      statusCode: 200,
      body: tenant,
    }).as("tenantQuery");

    cy.intercept("GET", "**/rest/v1/subscriptions*", {
      statusCode: 200,
      body: { current_period_end: tenant.current_period_end },
    });

    cy.intercept("GET", "**/rest/v1/billing_plans*", {
      statusCode: 200,
      body: [],
    });

    cy.intercept("GET", "**/rest/v1/clients*", (request) => {
      request.reply({ statusCode: 200, body: clients });
    }).as("clientsQuery");

    cy.intercept("POST", "**/rest/v1/rpc/check_trial_limit", {
      statusCode: 200,
      body: true,
    }).as("trialLimit");

    cy.intercept("POST", "**/functions/v1/manage-athlete", (request) => {
      if (mode === "duplicidade") {
        expect(request.body).to.include({
          fullName: "AlunoDuplicado",
          email: "existing@example.com",
          tenantId,
          isAthleteCreation: true,
        });

        request.reply({
          statusCode: 409,
          body: { error: "Este e-mail já está em uso por outro usuário." },
        });
        return;
      }

      expect(request.body).to.include({
        fullName: "AlunoQACypress",
        email: "aluno.qa.cypress@example.com",
        tenantId,
        isAthleteCreation: true,
      });
      expect(request.body.username).to.match(/^[a-z0-9]+\d{3}$/);
      expect(request.body.password).to.have.length.greaterThan(5);

      clients = [
        ...clients,
        createClient({
          id: createdClientId,
          user_id: "qa-created-user-id",
          full_name: request.body.fullName,
          email: request.body.email,
          username: request.body.username,
          provisional_password: request.body.password,
          assigned_coach_id: coachId,
          created_at: "2099-01-02T00:00:00.000Z",
          updated_at: "2099-01-02T00:00:00.000Z",
        }),
      ];

      request.reply({
        statusCode: 200,
        body: { success: true, userId: "qa-created-user-id" },
      });
    }).as("manageAthlete");
  }

  it("cria um aluno pelas três etapas e atualiza a lista", () => {
    mockCoachSession();

    cy.visit("/login");
    cy.get("#login-identifier").type("coach@example.com");
    cy.get("#login-password").type("Apex#2026");
    cy.contains("button", "Entrar no sistema").click();

    cy.wait("@passwordLogin");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
    cy.visit("/dashboard/clients");
    cy.get(".apex-client-list-row").should("have.length", 1);
    cy.contains("button", "CADASTRAR ALUNO").first().click();

    cy.contains("h3", "Quem é o aluno?").should("be.visible");
    cy.contains("button", "Próximo").should("be.disabled");
    cy.get('input[placeholder="Ex: João da Silva"]').type("AlunoQACypress", { delay: 30 });
    cy.get('input[placeholder="Ex: João da Silva"]').should("have.value", "AlunoQACypress");
    cy.get('input[placeholder="joao@email.com"]').type("aluno.qa.cypress@example.com");
    cy.contains("button", "Próximo").should("be.enabled").click();

    cy.contains("h3", "Como ele vai entrar?").should("be.visible");
    cy.contains("button", "Gerar").click();
    cy.get("#mentor-student-creds input").first().invoke("val").should("match", /^[a-z0-9]+\d{3}$/);
    cy.contains("button", "Próximo").should("be.enabled").click();

    cy.contains("h3", "Como será o acompanhamento?").should("be.visible");
    cy.contains("button", "Criar aluno").should("be.enabled").click();

    cy.wait("@trialLimit");
    cy.wait("@manageAthlete");
    cy.contains("Atleta adicionado com sucesso").should("be.visible");
    cy.contains("AlunoQACypress").should("be.visible");
    cy.contains("Prontas para compartilhar").should("be.visible");

    cy.contains("button", "Concluir e fechar").click();
    cy.contains("AlunoQACypress").should("be.visible");
    cy.contains("aluno.qa.cypress@example.com").should("be.visible");
  });

  it("bloqueia o cadastro quando o e-mail já pertence a um aluno", () => {
    mockCoachSession("duplicidade");

    cy.visit("/login");
    cy.get("#login-identifier").type("coach@example.com");
    cy.get("#login-password").type("Apex#2026");
    cy.contains("button", "Entrar no sistema").click();

    cy.wait("@passwordLogin");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
    cy.visit("/dashboard/clients");
    cy.get(".apex-client-list-row").should("have.length", 1);
    cy.contains("button", "CADASTRAR ALUNO").first().click();

    cy.contains("h3", "Quem é o aluno?").should("be.visible");
    cy.get('input[placeholder="Ex: João da Silva"]').type("AlunoDuplicado", { delay: 30 });
    cy.get('input[placeholder="joao@email.com"]').type("existing@example.com");
    cy.contains("button", "Próximo").click();

    cy.contains("h3", "Como ele vai entrar?").should("be.visible");
    cy.contains("button", "Gerar").click();
    cy.get("#mentor-student-creds input").first().invoke("val").should("match", /^[a-z0-9]+\d{3}$/);
    cy.contains("button", "Próximo").click();

    cy.contains("h3", "Como será o acompanhamento?").should("be.visible");
    cy.contains("button", "Criar aluno").click();

    cy.wait("@trialLimit");
    cy.wait("@manageAthlete");
    cy.contains("Erro no cadastro").should("be.visible");
    cy.contains("Atleta adicionado com sucesso").should("not.exist");
    cy.get('[data-testid="student-access-success"]').should("not.exist");

    cy.get(".apex-client-list-row").should("have.length", 1);
    cy.get(".apex-client-list-row").should("not.contain", "AlunoDuplicado");
  });
});
