# Plan de test

## Objectif
Garantir que l'application respecte les exigences fonctionnelles et non-fonctionnelles du cahier des charges : consultation des appartements, carte interactive, upload et affichage des images et DPE, édition des données, formulaire de contact, gestion des disponibilités, sécurité et performance. Le plan vise à détecter les anomalies, prévenir les régressions et assurer une livraison stable.

## Portée
- Parcours utilisateur : authentification, recherche et consultation d'un appartement, accès à la fiche détaillée, interaction avec la carte interactive, formulaire de contact, modification du statut de disponibilité, upload et visualisation d'images et DPE.
- Exigences non-fonctionnelles : sécurité d'accès (rôles/admin), performances perçues (lazy-loading, temps de réponse), compatibilité responsive, expérience utilisateur.

## Stratégie générale
- Approche mixte automatisée + manuelle :
  - Tests unitaires et d'intégration pour la logique métier et les composants isolés.
  - Tests E2E pour les parcours utilisateurs critiques.
  - Tests manuels pour l'UX, la responsivité et les vérifications visuelles (galerie, carte).
- Priorité sur les flux critiques : authentification, consultation/détail d'un appartement, upload d'images/DPE, envoi du formulaire de contact, modification des disponibilités.
- Vérification systématique des régressions via CI/CD.

## Environnements
- **Local** : Firebase Emulator Suite (Firestore, Auth) + stubs/mocks Cloudinary.
- **Staging** : déploiement de test avec jeux de données réalistes.
- **Production** : smoke tests post-déploiement.

## Typologie des tests
| Type | Objectif | Outils / Supports | Responsables |
| --- | --- | --- | --- |
| Tests unitaires | Valider les fonctions utilitaires, helpers de validation/formatage et composants isolés | Jest, React Testing Library | Équipe dev |
| Tests d'intégration | Vérifier l'interaction entre composants, hooks et services (Firestore) | Jest + RTL, Firebase Emulator | Équipe dev |
| Tests End-to-End | Couvrir les parcours liste → détail → contact / édition / upload | Cypress / Playwright, données seed | QA + dev |
| Tests manuels | Vérifier UX, responsivité, carte, aperçu images/PDF | Grille de tests manuels | QA |
| Tests de sécurité | Contrôler les accès protégés (routes admin), validations serveur | Tests ciblés + revues | Dev + Sec |
| Tests de performance | Audits Lighthouse, vérification lazy-loading images | Lighthouse CI / Chrome DevTools | QA + dev |

## Cas de test principaux
1. **Authentification**
   - Connexion utilisateur valide / invalide.
   - Accès aux routes admin protégé.
2. **Consultation des appartements**
   - Chargement de la liste depuis Firestore.
   - Filtrage / tri si disponibles.
   - Affichage de la carte interactive avec markers.
3. **Fiche détail**
   - Affichage des informations complètes (description, DPE, galerie photos).
   - Navigation sur les images (zoom, carousel).
4. **Upload d'images et DPE**
   - Upload valide (format, taille) et aperçu immédiat.
   - Gestion des erreurs (fichier trop lourd, format non supporté).
   - Persistance dans Firestore / Cloudinary (mocks en local).
5. **Édition des données**
   - Formulaire d'édition (validation, messages d'erreur).
   - Écriture Firestore réussie et rollback en cas d'échec.
6. **Formulaire de contact**
   - Envoi réussi et gestion des erreurs réseau.
   - Notifications ou confirmations d'envoi.
7. **Gestion des disponibilités**
   - Mise à jour du statut disponible / loué.
   - Synchronisation sur toutes les vues (liste, carte, détail).
8. **Compatibilité et UX**
   - Tests responsive (desktop, tablette, mobile).
   - Accessibilité minimale (focus, navigation clavier).

## Critères d'acceptation
- 100% des tests unitaires et d'intégration verts.
- Couverture minimale de 80% sur les modules critiques.
- Suite E2E passée sur staging.
- Cas manuels critiques validés (UX, carte, galerie, responsive).
- Aucun bug bloquant ou critique ouvert.

## Planning d'exécution
| Phase | Activités | Responsable | Fréquence |
| --- | --- | --- | --- |
| Développement continu | Écriture/mise à jour des tests unitaires & intégration, exécution locale | Dev | À chaque merge request |
| Validation QA | Exécution complète des suites unitaires + E2E, campagne manuelle responsive/UX | QA + Dev | Avant chaque release |
| Pré-production | Smoke tests sur staging | QA | J-1 |
| Livraison | Smoke tests en production, monitoring post-déploiement | Dev + Ops | Jour J |

## Suivi et reporting
- Intégration des tests automatisés dans la CI avec badges de statut.
- Rapport de campagne manuelle (tickets JIRA / Notion) avec statut (OK, NOK, Bloquant).
- Rétrospective post-release pour ajuster le plan de test.

## Gestion des anomalies
- Priorisation : P0 (bloquant), P1 (majeur), P2 (mineur), P3 (cosmétique).
- Ouverture via outil de ticketing avec reproduction, logs, captures.
- Suivi quotidien jusqu'à résolution, revalidation systématique.

