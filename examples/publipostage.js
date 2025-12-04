/**
 * Exemple de publipostage avec tibo-grafplot
 *
 * Ce script montre comment générer des documents HTML personnalisés
 * avec des graphiques pour chaque destinataire.
 */

const path = require('path')
const fs = require('fs').promises
const tiboGrafplot = require('../index')
const { generateForMailing, generateBatch, saveBatchToFiles } = require('../express')

// Données simulées de destinataires (ex: depuis une base de données)
const destinataires = [
  {
    id: 'dest_001',
    nom: 'Dupont',
    prenom: 'Jean',
    departement: 'Haute-Garonne',
    valeurs: { rond: 45.5, barre1: 67.2, barre2: 52.0, losange: 38.8, mini: 0, maxi: 100 }
  },
  {
    id: 'dest_002',
    nom: 'Martin',
    prenom: 'Marie',
    departement: 'Hérault',
    valeurs: { rond: 72.3, barre1: 55.1, barre2: 55.1, losange: 60.5, mini: 0, maxi: 100 } // barre1 === barre2 (empilées)
  },
  {
    id: 'dest_003',
    nom: 'Bernard',
    prenom: 'Pierre',
    departement: 'Aude',
    valeurs: { rond: 28.9, barre1: 41.7, barre2: 89.2, mini: 0, maxi: 100 } // Sans losange
  },
]

/**
 * Méthode 1 : Générer des fichiers HTML avec images base64 embarquées
 * Avantage : Un seul fichier HTML autonome
 * Inconvénient : Fichier plus lourd
 */
async function genererHtmlBase64() {
  console.log('=== Méthode 1 : HTML avec images Base64 ===\n')

  const outputDir = path.join(__dirname, 'output', 'publipostage-base64')
  await fs.mkdir(outputDir, { recursive: true })

  for (const dest of destinataires) {
    const graphique = await tiboGrafplot({
      ...dest.valeurs,
      output: 'base64'
    })

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport - ${dest.prenom} ${dest.nom}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .graphique { margin: 20px 0; }
    .legende { display: flex; gap: 20px; margin-top: 10px; }
    .legende-item { display: flex; align-items: center; gap: 5px; }
    .legende-color { width: 20px; height: 20px; border-radius: 50%; }
  </style>
</head>
<body>
  <h1>Rapport pour ${dest.prenom} ${dest.nom}</h1>
  <p><strong>Département :</strong> ${dest.departement}</p>

  <div class="graphique">
    <h2>Indicateurs</h2>
    <img src="${graphique}" alt="Graphique des indicateurs" />
    <div class="legende">
      <div class="legende-item">
        <div class="legende-color" style="background: #f7c948;"></div>
        <span>Département (${dest.valeurs.rond})</span>
      </div>
      <div class="legende-item">
        <div class="legende-color" style="background: #3d6b3d; border-radius: 0;"></div>
        <span>Région (${dest.valeurs.barre1})</span>
      </div>
      <div class="legende-item">
        <div class="legende-color" style="background: #e74c3c; border-radius: 0;"></div>
        <span>France (${dest.valeurs.barre2})</span>
      </div>
      ${dest.valeurs.losange ? `
      <div class="legende-item">
        <div class="legende-color" style="background: #ff8c00; transform: rotate(45deg);"></div>
        <span>Territoire (${dest.valeurs.losange})</span>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`

    const filePath = path.join(outputDir, `rapport_${dest.id}.html`)
    await fs.writeFile(filePath, html)
    console.log(`✅ ${filePath}`)
  }

  console.log('')
}

/**
 * Méthode 2 : Générer des fichiers HTML avec SVG inline
 * Avantage : Très léger, vectoriel
 * Inconvénient : Pas supporté par tous les clients email
 */
async function genererHtmlSvg() {
  console.log('=== Méthode 2 : HTML avec SVG inline ===\n')

  const outputDir = path.join(__dirname, 'output', 'publipostage-svg')
  await fs.mkdir(outputDir, { recursive: true })

  for (const dest of destinataires) {
    const graphique = await tiboGrafplot({
      ...dest.valeurs,
      output: 'svg'
    })

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport - ${dest.prenom} ${dest.nom}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .graphique { margin: 20px 0; }
    .graphique svg { display: block; }
  </style>
</head>
<body>
  <h1>Rapport pour ${dest.prenom} ${dest.nom}</h1>
  <p><strong>Département :</strong> ${dest.departement}</p>

  <div class="graphique">
    <h2>Indicateurs</h2>
    ${graphique}
  </div>
</body>
</html>`

    const filePath = path.join(outputDir, `rapport_${dest.id}.html`)
    await fs.writeFile(filePath, html)
    console.log(`✅ ${filePath}`)
  }

  console.log('')
}

/**
 * Méthode 3 : Générer des images séparées + HTML qui les référence
 * Avantage : Images réutilisables, HTML léger
 * Inconvénient : Plusieurs fichiers à gérer
 */
async function genererHtmlAvecFichiers() {
  console.log('=== Méthode 3 : HTML + images séparées ===\n')

  const outputDir = path.join(__dirname, 'output', 'publipostage-fichiers')
  const imagesDir = path.join(outputDir, 'images')
  await fs.mkdir(imagesDir, { recursive: true })

  for (const dest of destinataires) {
    // Générer l'image
    const imageName = `graph_${dest.id}.png`
    await tiboGrafplot({
      ...dest.valeurs,
      output: 'file',
      filePath: path.join(imagesDir, imageName)
    })

    // Générer le HTML
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport - ${dest.prenom} ${dest.nom}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <h1>Rapport pour ${dest.prenom} ${dest.nom}</h1>
  <p><strong>Département :</strong> ${dest.departement}</p>
  <img src="images/${imageName}" alt="Graphique" />
</body>
</html>`

    const filePath = path.join(outputDir, `rapport_${dest.id}.html`)
    await fs.writeFile(filePath, html)
    console.log(`✅ ${filePath} + images/${imageName}`)
  }

  console.log('')
}

/**
 * Méthode 4 : Utiliser generateBatch pour tout générer en parallèle
 */
async function genererBatch() {
  console.log('=== Méthode 4 : Batch (parallèle) ===\n')

  const items = destinataires.map(d => ({
    id: d.id,
    ...d.valeurs
  }))

  const graphs = await generateBatch(items)

  console.log('Graphiques générés :')
  for (const [id, graph] of Object.entries(graphs)) {
    console.log(`  ${id}: base64=${graph.base64.length} chars, svg=${graph.svg.length} chars`)
  }

  console.log('')
}

// Exécuter tous les exemples
async function main() {
  console.log('🚀 Exemples de publipostage avec tibo-grafplot\n')

  await genererHtmlBase64()
  await genererHtmlSvg()
  await genererHtmlAvecFichiers()
  await genererBatch()

  console.log('✅ Tous les exemples générés dans ./examples/output/')
}

main().catch(console.error)
