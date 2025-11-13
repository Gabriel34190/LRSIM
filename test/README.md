# Tests - LRSIM

## Objectif
Assurer la qualité fonctionnelle et non-fonctionnelle : consultation appartements, carte interactive, upload et affichage images/DPE, édition, contact, disponibilités, sécurité et performance.

## Périmètre livré

- Unitaires/Intégration (Jest + React Testing Library)
  - `NewLocationForm.test.js`: validations, succès upload (Cloudinary mock), erreur upload, écriture Firestore mockée.
  - `Connexion.test.js`: authentification succès/erreur, redirection.
  - `AppartementMap.test.js`: smoke de rendu avec géocodage mocké et `react-leaflet` simplifié.
  - `AppartementDetailsPage.test.js`: chargement depuis Firestore mocké, affichage sections principales.
  - `AppartementDetailsEdit.test.js`: édition d’un champ (name) avec sauvegarde `updateDoc` et DOM mis à jour.
  - `NavbarSecurity.test.js`: affichage Connexion/Déconnexion selon état d’auth.

- End-to-End (Cypress)
  - `cypress/e2e/smoke.cy.js`: accueil + navigation vers Propriétaires et Connexion.
  - Note: pour des parcours complets (liste → détail → contact/édition/upload), prévoir jeux de données en staging ou émulateurs.

- Tests manuels
  - Grille: `test/checklist.md` (responsive, galerie, DPE, carte, contact, disponibilités, accessibilité rapide).

- Performance
  - Guide Lighthouse: `test/perf-lighthouse.md` (audit manuel, critères, option CI).

## Installation et exécution

1. Dépendances
```bash
npm install
```

2. Tests unitaires/intégration
```bash
npm test -- --watch=false
```

3. E2E (Cypress)
```bash
# UI runner
npx cypress open

# Headless
npx cypress run
```

Assure-toi que l’app tourne sur `http://localhost:3000` pour les E2E (config: `cypress.config.js`).

## Mocks et environnements
- Firebase (Auth/Firestore) et Cloudinary sont mockés côté Jest pour des tests stables et rapides.
- Pour des E2E complets avec données: utiliser Firebase Emulator Suite (Firestore, Auth) en local ou un staging avec dataset de test.

## Extension suggérée (prochaines étapes)
- E2E complets:
  - Liste → détail → contact (mailto) → édition (admin) → upload (admin, mock serveur).
  - Vérifier la synchro des disponibilités entre pages.
- Sécurité:
  - Ajouter des guards de routes (admin) et écrire des tests d’accès (Jest + Cypress).
  - Tester les règles Firestore avec l’emulator (lecture/écriture par rôle).
- Performance:
  - Intégrer Lighthouse CI et seuils (ex: Perf ≥ 80) en pipeline.
- Utilitaires:
  - Si des helpers dédiés (validation/formatage) sont extraits, ajouter des tests unitaires dédiés.

## Fichiers clés

```text
test/plan.md                   # Plan de test global
test/checklist.md              # Checklist de tests manuels
test/perf-lighthouse.md        # Guide pour audits performance
src/__tests__/*                # Suites Jest/RTL
cypress/e2e/smoke.cy.js        # Smoke/navigation E2E
cypress.config.js              # Config Cypress
```

## Critères d’acceptation (rappel)
- 100% des tests Jest/RTL passent.
- Smoke E2E OK.
- Checklist manuelle critique validée (responsive, carte, galerie).
- Pas de bug bloquant ouvert.



