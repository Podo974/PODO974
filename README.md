# PodoTriage — prototype PWA

Prototype gratuit de pré-consultation pied/genou pour tablette.

## Lancer localement

Option la plus simple :
1. Ouvrir `index.html` dans un navigateur moderne.
2. Pour l'installation PWA complète, servir le dossier avec un petit serveur HTTP local :
   `python -m http.server 8080`
3. Ouvrir `http://localhost:8080` sur la tablette connectée au même réseau.

## Données

Cette version ne contient aucun serveur et stocke temporairement l'état courant dans `localStorage`.
Ne pas utiliser ce prototype tel quel pour des données de santé réelles en production.

## Contenu clinique actuel

Parcours initiaux :
- douleur plantaire du talon / fasciopathie plantaire
- hallux limitus / rigidus
- névralgie interdigital / Morton à explorer
- tendinopathie d'Achille
- pied plat symptomatique / dysfonction médiale à explorer
- douleur fémoro-patellaire
- atteinte méniscale à explorer
- syndrome de bandelette ilio-tibiale
- tendinopathie patellaire
- red flags de base

Les scores sont des règles d'orientation, pas des probabilités diagnostiques.
