# tibo-grafplot

Module Node.js standalone pour la generation de graphiques avec formes geometriques (rond, barres, losange) positionnees sur une echelle dynamique.

## Installation

```bash
# Depuis GitHub
npm install github:acetibo/tibo-grafplot

# Ou en copiant le dossier
cp -r tibo-grafplot/ mon-projet/node_modules/
```

## Utilisation rapide

```javascript
const tiboGrafplot = require('tibo-grafplot')

// Generer un graphique (Buffer PNG par defaut)
const buffer = await tiboGrafplot({
  rond: 45.5,
  barre1: 67.2,
  barre2: 52.0,
  losange: 38.8,
  mini: 0,
  maxi: 100
})
```

## API

### tiboGrafplot(options)

Fonction principale de generation.

#### Parametres (valeurs)

| Parametre | Type | Description |
|-----------|------|-------------|
| `rond` | `number\|null` | Valeur du cercle |
| `barre1` | `number\|null` | Valeur de la barre 1 |
| `barre2` | `number\|null` | Valeur de la barre 2 |
| `losange` | `number\|null` | Valeur du losange |
| `mini` | `number` | Valeur minimum de l'echelle (defaut: 0) |
| `maxi` | `number` | Valeur maximum de l'echelle (defaut: 100) |

#### Parametres (configuration)

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `width` | `number` | 620 | Largeur en pixels |
| `height` | `number` | 28 | Hauteur en pixels |
| `barWidth` | `number` | 4 | Epaisseur des barres en pixels |
| `colors` | `object` | voir ci-dessous | Couleurs personnalisees |
| `zIndex` | `object` | voir ci-dessous | Ordre de superposition |

#### Parametres (sortie)

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `output` | `string` | `'buffer'` | Type de sortie (voir ci-dessous) |
| `filePath` | `string` | - | Chemin du fichier (si output='file') |
| `jpegQuality` | `number` | 0.9 | Qualite JPEG (0 a 1) |

#### Types de sortie (output)

| Valeur | Description | Retour |
|--------|-------------|--------|
| `'buffer'` ou `'png'` | Buffer PNG | `Buffer` |
| `'base64'` ou `'png-base64'` | PNG en base64 | `string` (data:image/png;base64,...) |
| `'jpeg'` ou `'jpg'` | Buffer JPEG | `Buffer` |
| `'jpeg-base64'` ou `'jpg-base64'` | JPEG en base64 | `string` |
| `'svg'` | SVG vectoriel | `string` (XML) |
| `'file'` | Fichier (auto-detecte le format) | `object` |

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
  rond: 1,      // Arriere-plan
  losange: 2,
  barre1: 3,
  barre2: 4     // Premier plan
}
```

## Comportement special : Barres egales

Quand `barre1 === barre2` (egalite stricte), les barres sont **empilees verticalement** a la meme position, chacune faisant la moitie de la hauteur.

## Exemples

### Formats de sortie

```javascript
// PNG (defaut)
const png = await tiboGrafplot({ rond: 50, barre1: 70, mini: 0, maxi: 100 })

// JPEG
const jpeg = await tiboGrafplot({ ...data, output: 'jpeg' })

// JPEG basse qualite
const jpegLight = await tiboGrafplot({ ...data, output: 'jpeg', jpegQuality: 0.5 })

// SVG (le plus leger)
const svg = await tiboGrafplot({ ...data, output: 'svg' })

// Base64 pour HTML inline
const base64 = await tiboGrafplot({ ...data, output: 'base64' })

// Fichier (auto-detecte le format selon l'extension)
await tiboGrafplot({ ...data, output: 'file', filePath: './graph.png' })
await tiboGrafplot({ ...data, output: 'file', filePath: './graph.svg' })
```

### Personnalisation

```javascript
const buffer = await tiboGrafplot({
  rond: 45,
  barre1: 67,
  barre2: 52,
  losange: 38,
  mini: 0,
  maxi: 100,
  width: 400,
  height: 32,
  barWidth: 6,
  colors: {
    background: '#f0f0f0',
    rond: '#2196F3',
    barre1: '#4CAF50',
    barre2: '#FF5722',
    losange: '#9C27B0'
  }
})
```

## Integration Express/Pug

### Methode 1 : Middleware avec helpers Pug

```javascript
// app.js
const { pugHelpers } = require('tibo-grafplot/express')

app.use(pugHelpers({
  defaultConfig: { width: 500, height: 24 }
}))
```

```pug
//- Dans un template Pug
img(src=await grafplot({ rond: 50, barre1: 70, mini: 0, maxi: 100 }))

//- SVG inline
!= await grafplotSvg({ rond: 50, barre1: 70, mini: 0, maxi: 100 })
```

### Methode 2 : Route API

```javascript
// app.js
const { createRoute } = require('tibo-grafplot/express')

app.use('/grafplot', createRoute())
```

```html
<!-- Appel via URL -->
<img src="/grafplot?rond=50&barre1=70&mini=0&maxi=100&format=png" />
<img src="/grafplot?rond=50&barre1=70&format=svg" />
```

### Methode 3 : Generation dans le controller

```javascript
// controller
const tiboGrafplot = require('tibo-grafplot')

exports.showReport = async (req, res) => {
  const data = await getDataFromDB(req.params.id)

  const graphBase64 = await tiboGrafplot({
    ...data,
    output: 'base64'
  })

  res.render('report', { graphBase64 })
}
```

```pug
//- views/report.pug
img(src=graphBase64 alt="Graphique")
```

## Publipostage

Pour generer des documents HTML personnalises avec graphiques :

```javascript
const { generateForMailing, generateBatch } = require('tibo-grafplot/express')

// Un seul graphique avec tous les formats
const graph = await generateForMailing({ rond: 50, barre1: 70, mini: 0, maxi: 100 })
// graph.base64 -> pour <img src="...">
// graph.svg -> pour SVG inline
// graph.imgTag -> <img src="data:..." /> pret a l'emploi

// Batch de graphiques
const graphs = await generateBatch([
  { id: 'graph1', rond: 50, barre1: 70, mini: 0, maxi: 100 },
  { id: 'graph2', rond: 30, barre1: 60, mini: 0, maxi: 100 },
])
// graphs['graph1'].base64
// graphs['graph2'].svg
```

Voir `examples/publipostage.js` pour des exemples complets.

## Valeurs speciales

Les valeurs suivantes sont traitees comme `null` (non affichees) :

- `null`, `undefined`
- `'nd'`, `'nc'`, `'ND'`, `'#ND'`, `'#N/D'`, `'/'`
- `1000000000`, `999999999`, `88888900`, `88888888`

## Dependances

- `canvas` >= 2.11.2
- `express` (optionnel, pour les helpers Express)

## License

MIT
