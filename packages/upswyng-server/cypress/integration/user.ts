describe("User Access", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("can log in", () => {
    cy.server();
    // https://github.com/simov/grant/blob/master/config/oauth.json#L410
    const authorizeUrl = "https://accounts.google.com/o/oauth2/auth/**/*";
    const accessUrl = "https://accounts.google.com/o/oauth2/token";
    const log = (x: any) => {
      console.log(x);
    };
    cy.route("GET", authorizeUrl, log);
    cy.route("POST", authorizeUrl, log);
    cy.route("GET", accessUrl, log);
    cy.route("POST", accessUrl, log);

    cy.contains("Log In").click();
    cy.url().should("include", "/login");
    cy.get('a[href*="connect/google"]').click();
  });
});

export {}; // make typescript happy
