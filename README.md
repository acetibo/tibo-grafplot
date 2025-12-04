# tibo-grafplot

Module Node.js standalone pour la generation de graphiques avec formes geometriques (rond, barres, losange) positionnees sur une echelle dynamique.

## Installation

```bash
npm install tibo-grafplot
```

Ou en copiant le dossier dans votre projet :

```bash
cp -r tibo-grafplot/ mon-projet/node_modules/
```

## Utilisation rapide

```javascript
const tiboGrafplot = require('tibo-grafplot')

// Generer un graphique et obtenir un Buffer PNG
const buffer = await tiboGrafplot({
  rond: 45.5,
  barre1: 67.2,
  barre2: 52.0,
  losange: 38.8,
  mini: 0,
  maxi: 100
})

// Enregistrer le buffer dans un fichier
const fs = require('fs').promises
await fs.writeFile('graphique.png', buffer)
```

## API

### tiboGrafplot(options)

Fonction principale de generation.

#### Parametres requis (valeurs)

| Parametre | Type | Description |
|-----------|------|-------------|
| `rond` | `number\|null` | Valeur du cercle |
| `barre1` | `number\|null` | Valeur de la barre 1 |
| `barre2` | `number\|null` | Valeur de la barre 2 |
| `losange` | `number\|null` | Valeur du losange |
| `mini` | `number` | Valeur minimum de l'echelle (defaut: 0) |
| `maxi` | `number` | Valeur maximum de l'echelle (defaut: 100) |

#### Parametres optionnels (configuration)

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `width` | `number` | 620 | Largeur du graphique en pixels |
| `height` | `number` | 28 | Hauteur du graphique en pixels |
| `colors` | `object` | voir ci-dessous | Couleurs personnalisees |
| `zIndex` | `object` | voir ci-dessous | Ordre de superposition |
| `output` | `string` | 'buffer' | Type de sortie: 'buffer', 'base64', 'file' |
| `filePath` | `string` | - | Chemin du fichier (requis si output='file') |

#### Couleurs par defaut

```javascript
{
  background: '#FFFFFF',
  rond: '#f7c948',
  barre1: '#3d6b3d',
  barre2: '#e74c3c',
  losange: '#ff8c00'
}
```

#### Z-Index par defaut

```javascript
{
  rond: 1,      // Dessine en premier (arriere-plan)
  losange: 2,
  barre1: 3,
  barre2: 4     // Dessine en dernier (premier plan)
}
```

### Methodes raccourcies

```javascript
const { toBuffer, toBase64, toFile } = require('tibo-grafplot')

// Retourne un Buffer PNG
const buffer = await toBuffer({ rond: 50, barre1: 75, mini: 0, maxi: 100 })

// Retourne une Data URL base64
const dataUrl = await toBase64({ rond: 50, barre1: 75, mini: 0, maxi: 100 })

// Enregistre dans un fichier et retourne les metadonnees
const result = await toFile({
  rond: 50,
  barre1: 75,
  mini: 0,
  maxi: 100,
  filePath: './output/graphique.png'
})
```

## Exemples

### Graphique simple

```javascript
const tiboGrafplot = require('tibo-grafplot')

const buffer = await tiboGrafplot({
  rond: 45,
  barre1: 67,
  barre2: 52,
  mini: 0,
  maxi: 100
})
```

### Avec couleurs personnalisees

```javascript
const buffer = await tiboGrafplot({
  rond: 45,
  barre1: 67,
  barre2: 52,
  losange: 38,
  mini: 0,
  maxi: 100,
  colors: {
    background: '#f0f0f0',
    rond: '#2196F3',
    barre1: '#4CAF50',
    barre2: '#FF5722',
    losange: '#9C27B0'
  }
})
```

### Dimensions personnalisees

```javascript
const buffer = await tiboGrafplot({
  rond: 45,
  barre1: 67,
  mini: 0,
  maxi: 100,
  width: 400,
  height: 20
})
```

### Pour affichage inline (base64)

```javascript
const { toBase64 } = require('tibo-grafplot')

const dataUrl = await toBase64({
  rond: 45,
  barre1: 67,
  mini: 0,
  maxi: 100
})

// Utilisation dans HTML/Pug
// <img src="${dataUrl}" alt="Graphique" />
```

### Enregistrement dans un fichier

```javascript
const { toFile } = require('tibo-grafplot')

const result = await toFile({
  rond: 45,
  barre1: 67,
  barre2: 52,
  losange: 38,
  mini: 0,
  maxi: 100,
  filePath: './public/images/mon-graphique.png'
})

console.log(result)
// {
//   filename: 'mon-graphique.png',
//   path: './public/images/mon-graphique.png',
//   size: 1234,
//   width: 620,
//   height: 28
// }
```

## Utilisation avec Express/Pug

### Helper pour Pug

```javascript
// app.js
const tiboGrafplot = require('tibo-grafplot')

app.locals.tiboGrafplot = async (options) => {
  return await tiboGrafplot.toBase64(options)
}
```

### Dans un template Pug

```pug
//- views/graphique.pug
- const graphUrl = await tiboGrafplot({ rond: 45, barre1: 67, mini: 0, maxi: 100 })
img(src=graphUrl alt="Graphique")
```

**Note** : Pug ne supporte pas nativement les fonctions async. Voir la section "Integration Express" pour une solution.

### Integration Express (recommandee)

```javascript
// routes/graphique.js
const express = require('express')
const tiboGrafplot = require('tibo-grafplot')
const router = express.Router()

router.get('/graphique/:id', async (req, res) => {
  // Recuperer les donnees depuis la BDD ou autre
  const data = { rond: 45, barre1: 67, barre2: 52, mini: 0, maxi: 100 }

  // Generer le graphique
  const buffer = await tiboGrafplot(data)

  // Envoyer l'image
  res.set('Content-Type', 'image/png')
  res.send(buffer)
})

module.exports = router
```

```pug
//- views/page.pug
img(src="/graphique/123" alt="Graphique")
```

## Valeurs speciales

Les valeurs suivantes sont traitees comme `null` (non affichees) :

- `null`, `undefined`
- `'nd'`, `'nc'`, `'ND'`, `'#ND'`, `'#N/D'`, `'/'`
- `1000000000`, `999999999`, `88888900`, `88888888`

## Dependances

- `canvas` >= 2.11.2

## License

MIT
