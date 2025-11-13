# Projet LRSIM - Gestion des Appartements

## Contexte du projet
Le projet **LRSIM** vise à développer une application web permettant de gérer des appartements disponibles à la location. Cette application est destinée à simplifier la gestion des biens immobiliers, tout en offrant une interface intuitive pour les utilisateurs.

---

## Objectifs généraux et spécifiques

### Objectifs généraux :
- Centraliser les informations des appartements dans une application unique.
- Permettre aux utilisateurs de consulter les détails des appartements et leur localisation.
- Faciliter la gestion des données pour les administrateurs (ajout, modification, suppression).

### Objectifs spécifiques :
- Intégrer une carte interactive pour afficher la localisation des appartements.
- Permettre l'édition des informations des appartements en temps réel.
- Ajouter des fonctionnalités de gestion des diagnostics énergétiques (DPE).
- Offrir une expérience utilisateur fluide et moderne.

---

## Fonctionnalités attendues / User Stories

### Fonctionnalités principales :
- **Consultation des appartements** : Les utilisateurs peuvent voir les détails des appartements (adresse, prix, description, etc.).
- **Carte interactive** : Affichage de la localisation des appartements sur une carte avec possibilité d'obtenir un itinéraire.
- **Gestion des images** : Ajout, suppression et visualisation des photos des appartements.
- **Gestion des diagnostics énergétiques (DPE)** : Upload et affichage des diagnostics énergétiques.
- **Modification des données** : Les administrateurs peuvent modifier les informations des appartements.

### User Stories :
1. En tant qu'utilisateur, je veux consulter les détails d'un appartement pour évaluer s'il correspond à mes besoins.
2. En tant qu'utilisateur, je veux voir la localisation d'un appartement sur une carte pour planifier ma visite.
3. En tant qu'administrateur, je veux pouvoir modifier les informations d'un appartement pour les tenir à jour.
4. En tant qu'administrateur, je veux ajouter des diagnostics énergétiques pour chaque appartement.
5. En tant qu'utilisateur, je veux pouvoir contacter le gestionnaire via un formulaire intégré.

---

## Technologies à utiliser
- **Frontend** : React.js, Leaflet (pour la carte interactive).
- **Backend** : Firebase (Firestore pour la base de données, Auth pour l'authentification).
- **API** : Nominatim (OpenStreetMap) pour le géocodage des adresses.
- **Cloud Storage** : Cloudinary pour l'hébergement des images.
- **CSS** : Tailwind CSS ou CSS classique pour le design.

---

## Contraintes techniques
- L'application doit être responsive et accessible sur mobile.
- Les données doivent être sécurisées (authentification Firebase).
- Les appels API doivent être optimisés pour minimiser les temps de réponse.
- Les images doivent être compressées avant l'upload pour réduire la consommation de bande passante.

---

## Livrables attendus
- Une application web fonctionnelle avec toutes les fonctionnalités décrites.
- Un code source documenté et organisé.
- Un fichier `README.md` détaillant le projet.
- Une documentation utilisateur pour expliquer les principales fonctionnalités.

---

## Estimation de charge (temps)
- **Analyse et conception** : 10 heures.
- **Développement des fonctionnalités principales** : 40 heures.
- **Tests et débogage** : 10 heures.
- **Total estimé** : **60 heures**.

---

## Organisation / étapes / jalons
1. **Phase 1 : Analyse et conception** (2 jours)
   - Définir les besoins fonctionnels et techniques.
   - Concevoir l'architecture de l'application.

2. **Phase 2 : Développement** (1 semaine)
   - Implémenter les fonctionnalités principales.
   - Intégrer les API et services externes.

3. **Phase 3 : Tests et validation** (2 jours)
   - Effectuer des tests unitaires et d'intégration.
   - Corriger les bugs identifiés.

4. **Phase 4 : Documentation et livraison** (1 jour)
   - Rédiger la documentation utilisateur et technique.
   - Préparer la livraison du projet.

---

## Équipe projet
- **Nom** : Gabriel Rouchon
- **Rôle** : Développeur principal.
- **Responsabilités** :
  - Développement frontend et backend.
  - Intégration des API.
  - Tests et validation.

---

## Planning / calendrier précis
| Étape                  | Durée estimée | Dates prévues       |
|------------------------|---------------|---------------------|
| Analyse et conception  | 2 jours       | 01/11/2023 - 02/11/2023 |
| Développement          | 1 semaine     | 03/11/2023 - 09/11/2023 |
| Tests et validation    | 2 jours       | 10/11/2023 - 11/11/2023 |
| Documentation et livraison | 1 jour    | 12/11/2023          |

---

## Budget / ressources nécessaires
- **Budget** : Aucun coût direct (utilisation de services gratuits comme Firebase et Nominatim).
- **Ressources nécessaires** :
  - Un ordinateur avec un environnement de développement configuré.
  - Une connexion Internet stable.
  - Accès aux comptes Firebase et Cloudinary.