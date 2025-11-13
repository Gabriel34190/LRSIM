# Guide performance (Lighthouse)

## Objectif
Réaliser des audits Lighthouse sur les pages critiques (Accueil, Détail appartement, Connexion) et vérifier le lazy-loading des images.

## Pré-requis
- Application démarrée en local (`npm start`) ou déployée en staging
- Chrome installé

## Exécution manuelle
1. Ouvrir la page cible (ex: http://localhost:3000/)
2. Ouvrir DevTools > Lighthouse
3. Sélectionner: Performance, Best Practices, Accessibility, SEO
4. Mode: Mobile et Desktop
5. Lancer l’audit et exporter le rapport (.html)

## Points à vérifier
- Score Performance ≥ 80 sur pages critiques
- Images avec attributs de taille et lazy-loading (vérifier via DevTools Network: images hors écran ne doivent pas être chargées)
- Bundles raisonnables (voir Coverage/Network)

## Automatisation (option)
- Utiliser Lighthouse CI (`@lhci/cli`) dans la CI
- Stocker les rapports dans `test/reports/lighthouse/`



