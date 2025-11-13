describe('Smoke - Parcours principal', () => {
  it('charge la page d’accueil et affiche la navbar', () => {
    cy.visit('/');
    cy.contains('LRSIM').should('be.visible');
    cy.contains('Accueil').should('be.visible');
    cy.contains('Propriétaires').should('be.visible');
  });

  it('navigue vers la page Propriétaires et Connexion', () => {
    cy.visit('/');
    cy.contains('Propriétaires').click();
    cy.url().should('include', '/proprietaires');

    cy.contains('Connexion').click();
    cy.url().should('include', '/connexion');
    cy.contains('Connexion').should('be.visible');
  });
});


