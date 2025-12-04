# Changelog

Toutes les modifications notables de ce projet seront documentees dans ce fichier.

## [1.0.0] - 2025-12-04

### Ajoute

- **Module principal** (`index.js`)
  - Generation de graphiques avec 4 formes geometriques (rond, barres, losange)
  - Positionnement sur echelle dynamique (mini/maxi)
  - Gestion des collisions entre barres
  - Normalisation des valeurs (formats francais, valeurs speciales)

- **Formats de sortie**
  - PNG (buffer et base64)
  - JPEG (buffer et base64, qualite configurable)
  - SVG (vectoriel, tres leger)
  - Fichier (auto-detection du format selon extension)

- **Parametres configurables**
  - Dimensions (width, height)
  - Epaisseur des barres (barWidth)
  - Couleurs personnalisees (background, rond, barre1, barre2, losange)
  - Z-index personnalises

- **Comportement special**
  - Barres empilees verticalement en cas d'egalite stricte (barre1 === barre2)

- **Helpers Express/Pug** (`express.js`)
  - `pugHelpers()` : Middleware pour ajouter des helpers dans les templates Pug
  - `createRoute()` : Route API pour generer des graphiques via URL
  - `generateForMailing()` : Generation multi-format pour publipostage
  - `generateBatch()` : Generation en batch (parallele)
  - `saveBatchToFiles()` : Sauvegarde batch dans un dossier

- **Exemples**
  - `examples/basic.js` : Exemples de base
  - `examples/publipostage.js` : 4 methodes de publipostage

### Documentation

- README.md complet avec API, exemples et integration Express/Pug
- CHANGELOG.md

## Installation

```bash
npm install github:acetibo/tibo-grafplot
```

## Liens

- Repository : https://github.com/acetibo/tibo-grafplot
