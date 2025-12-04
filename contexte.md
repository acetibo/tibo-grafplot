# Contexte du Projet - tibo-grafplot

## 📅 Dernière mise à jour : 4 décembre 2025

---

## 🎯 Vue d'ensemble du projet

**Projet** : Module npm standalone de génération de graphiques
**Origine** : Extrait du projet `generator-chart` (TibO GraphLot)
**Repository** : https://github.com/acetibo/tibo-grafplot

### Description

Module Node.js pour générer des graphiques avec 4 formes géométriques (rond, barres, losange) positionnées sur une échelle dynamique (min/max). Conçu pour être réutilisable dans différents projets Express/Node.js.

### Stack technique

- **Runtime** : Node.js >= 18.x
- **Génération d'images** : canvas (node-canvas)
- **Formats** : PNG, JPEG, SVG, Base64
- **Intégration** : Express.js, Pug (optionnel)

### Organisation des dossiers

```
tibo-grafplot/
├── index.js           # Module principal
├── express.js         # Helpers Express/Pug
├── package.json
├── README.md          # Documentation utilisateur
├── CHANGELOG.md       # Historique des versions
├── contexte.md        # Ce fichier (historique dev)
├── examples/
│   ├── basic.js       # Exemples basiques
│   └── publipostage.js # Exemples de publipostage
└── templates/
    └── claude-command.md # Template slash command Claude
```

---

## 🚀 Session #1 - Création du module (4 décembre 2025)

### Objectif

Extraire le service de génération de graphiques (`graphique.service.js`) du projet `generator-chart` en un module npm standalone réutilisable.

### Décisions prises

#### 1. Architecture standalone

Le module est **indépendant** :
- ❌ Pas de base de données
- ❌ Pas d'interface utilisateur
- ✅ Fonction pure : paramètres en entrée → image en sortie

#### 2. Distribution via GitHub

```bash
npm install github:acetibo/tibo-grafplot
```

**Raison** : Plus simple que npm registry, gratuit pour repo privé.

#### 3. Formats de sortie multiples

| Format | Output | Cas d'usage |
|--------|--------|-------------|
| PNG | `buffer` | Manipulation, envoi HTTP |
| PNG Base64 | `base64` | `<img src="data:...">` |
| JPEG | `jpeg` | Compression avec perte |
| SVG | `svg` | Vectoriel, très léger |
| Fichier | `file` | Sauvegarde sur disque |

#### 4. Paramètres configurables

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `width` | 620 | Largeur en pixels |
| `height` | 28 | Hauteur en pixels |
| `barWidth` | 4 | Épaisseur des barres |
| `colors.*` | - | Couleurs personnalisées |
| `zIndex.*` | - | Ordre de superposition |
| `jpegQuality` | 0.9 | Qualité JPEG (0 à 1) |

#### 5. Comportement spécial des barres

**Règle** : Quand `barre1 === barre2` (égalité stricte), les barres sont **empilées verticalement** à la même position, chacune faisant la moitié de la hauteur.

**Raison** : Permettre de visualiser deux valeurs identiques sans qu'une masque l'autre.

### Fonctionnalités implémentées

#### Module principal (`index.js`)

- `tiboGrafplot(options)` : Fonction principale
- `toBuffer(options)` : Raccourci pour PNG buffer
- `toBase64(options)` : Raccourci pour PNG base64
- `toFile(options)` : Raccourci pour fichier
- `DEFAULT_CONFIG` : Configuration par défaut exportée

#### Helpers Express (`express.js`)

- `pugHelpers(options)` : Middleware pour templates Pug
- `createRoute(options)` : Route API pour génération via URL
- `generateForMailing(data, options)` : Multi-format pour publipostage
- `generateBatch(items, options)` : Génération en batch (parallèle)
- `saveBatchToFiles(items, outputDir, options)` : Sauvegarde batch

### Commits créés

1. `Initial commit - tibo-grafplot v1.0.0`
2. `feat: Empiler les barres en cas d'égalité stricte des valeurs`
3. `feat: Ajouter paramètre barWidth pour l'épaisseur des barres`
4. `feat: Ajouter formats de sortie JPEG et SVG`
5. `feat: Ajouter helpers Express/Pug et exemples de publipostage`
6. `docs: Ajouter CHANGELOG.md`
7. `feat: Ajouter template de slash command Claude pour installation`

### Tests effectués

- ✅ Génération PNG (buffer et fichier)
- ✅ Génération JPEG (qualité haute et basse)
- ✅ Génération SVG
- ✅ Génération Base64 (PNG et JPEG)
- ✅ Barres empilées en cas d'égalité
- ✅ Épaisseur des barres configurable
- ✅ Exemples de publipostage (4 méthodes)

### Résultat final

**Statut** : ✅ **MODULE CRÉÉ ET PUBLIÉ SUR GITHUB**

---

## 📊 API Reference

### Utilisation basique

```javascript
const tiboGrafplot = require('tibo-grafplot')

const buffer = await tiboGrafplot({
  rond: 45.5,
  barre1: 67.2,
  barre2: 52.0,
  losange: 38.8,
  mini: 0,
  maxi: 100
})
```

### Avec personnalisation

```javascript
const buffer = await tiboGrafplot({
  rond: 45,
  barre1: 67,
  barre2: 52,
  mini: 0,
  maxi: 100,
  width: 400,
  height: 32,
  barWidth: 6,
  output: 'svg',
  colors: {
    background: '#f0f0f0',
    rond: '#2196F3',
    barre1: '#4CAF50',
    barre2: '#FF5722',
    losange: '#9C27B0'
  }
})
```

### Intégration Express/Pug

```javascript
// app.js
const { pugHelpers } = require('tibo-grafplot/express')
app.use(pugHelpers())

// Dans Pug
img(src=await grafplot({ rond: 50, barre1: 70, mini: 0, maxi: 100 }))
```

### Publipostage

```javascript
const { generateForMailing, generateBatch } = require('tibo-grafplot/express')

// Un seul graphique
const graph = await generateForMailing({ rond: 50, barre1: 70, mini: 0, maxi: 100 })
// graph.base64, graph.svg, graph.imgTag

// Batch
const graphs = await generateBatch([
  { id: 'g1', rond: 50, barre1: 70, mini: 0, maxi: 100 },
  { id: 'g2', rond: 30, barre1: 60, mini: 0, maxi: 100 },
])
```

---

## 📝 Notes importantes

### Valeurs spéciales

Les valeurs suivantes sont traitées comme `null` (non affichées) :

- `null`, `undefined`
- `'nd'`, `'nc'`, `'ND'`, `'#ND'`, `'#N/D'`, `'/'`
- `1000000000`, `999999999`, `88888900`, `88888888`

### Couleurs par défaut

```javascript
{
  background: '#FFFFFF',
  rond: '#f7c948',      // Jaune
  barre1: '#3d6b3d',    // Vert
  barre2: '#e74c3c',    // Rouge
  losange: '#ff8c00'    // Orange
}
```

### Z-Index par défaut

```javascript
{
  rond: 1,      // Arrière-plan
  losange: 2,
  barre1: 3,
  barre2: 4     // Premier plan
}
```

---

## 🔗 Liens

- **Repository** : https://github.com/acetibo/tibo-grafplot
- **Projet parent** : generator-chart (TibO GraphLot)
- **Installation** : `npm install github:acetibo/tibo-grafplot`

---

## 🔄 Prochaines étapes potentielles

1. **Nouvelles formes géométriques** :
   - Triangle
   - Carré
   - Étoile

2. **Fonctionnalités avancées** :
   - Légendes optionnelles
   - Animations SVG
   - Thèmes prédéfinis

3. **Publication npm** :
   - Publier sur npm registry (si besoin de distribution publique)
   - Ajouter des tests unitaires avec Jest
   - Ajouter CI/CD avec GitHub Actions

---

## ✅ Checklist de documentation

- [x] README.md - Documentation utilisateur
- [x] CHANGELOG.md - Historique des versions
- [x] contexte.md - Historique de développement
- [x] examples/basic.js - Exemples basiques
- [x] examples/publipostage.js - Exemples publipostage
- [x] templates/claude-command.md - Slash command Claude
