/**
 * Exemple d'utilisation de tibo-grafplot
 */

const path = require('path')
const fs = require('fs').promises
const tiboGrafplot = require('../index')

async function main() {
  console.log('=== tibo-grafplot - Exemples ===\n')

  // Créer le dossier output s'il n'existe pas
  const outputDir = path.join(__dirname, 'output')
  await fs.mkdir(outputDir, { recursive: true })

  // Exemple 1 : Graphique simple avec buffer
  console.log('1. Graphique simple (buffer -> fichier)')
  const buffer1 = await tiboGrafplot({
    rond: 45,
    barre1: 67,
    barre2: 52,
    mini: 0,
    maxi: 100,
  })
  await fs.writeFile(path.join(outputDir, 'exemple1-simple.png'), buffer1)
  console.log('   -> exemple1-simple.png créé\n')

  // Exemple 2 : Avec losange
  console.log('2. Graphique avec losange')
  const buffer2 = await tiboGrafplot({
    rond: 30,
    barre1: 50,
    barre2: 70,
    losange: 85,
    mini: 0,
    maxi: 100,
  })
  await fs.writeFile(path.join(outputDir, 'exemple2-losange.png'), buffer2)
  console.log('   -> exemple2-losange.png créé\n')

  // Exemple 3 : Couleurs personnalisées
  console.log('3. Couleurs personnalisées')
  const buffer3 = await tiboGrafplot({
    rond: 25,
    barre1: 50,
    barre2: 75,
    losange: 90,
    mini: 0,
    maxi: 100,
    colors: {
      background: '#1a1a2e',
      rond: '#e94560',
      barre1: '#0f3460',
      barre2: '#16213e',
      losange: '#f1c40f',
    },
  })
  await fs.writeFile(path.join(outputDir, 'exemple3-couleurs.png'), buffer3)
  console.log('   -> exemple3-couleurs.png créé\n')

  // Exemple 4 : Dimensions personnalisées
  console.log('4. Dimensions personnalisées (400x40)')
  const buffer4 = await tiboGrafplot({
    rond: 33,
    barre1: 66,
    mini: 0,
    maxi: 100,
    width: 400,
    height: 40,
  })
  await fs.writeFile(path.join(outputDir, 'exemple4-dimensions.png'), buffer4)
  console.log('   -> exemple4-dimensions.png créé\n')

  // Exemple 5 : Échelle personnalisée
  console.log('5. Échelle personnalisée (0-200)')
  const buffer5 = await tiboGrafplot({
    rond: 50,
    barre1: 100,
    barre2: 150,
    losange: 180,
    mini: 0,
    maxi: 200,
  })
  await fs.writeFile(path.join(outputDir, 'exemple5-echelle.png'), buffer5)
  console.log('   -> exemple5-echelle.png créé\n')

  // Exemple 6 : Sortie base64
  console.log('6. Sortie base64')
  const base64 = await tiboGrafplot.toBase64({
    rond: 40,
    barre1: 60,
    mini: 0,
    maxi: 100,
  })
  console.log(`   -> Data URL: ${base64.substring(0, 50)}...`)
  console.log(`   -> Longueur: ${base64.length} caractères\n`)

  // Exemple 7 : Sortie fichier avec métadonnées
  console.log('7. Sortie fichier avec métadonnées')
  const result = await tiboGrafplot.toFile({
    rond: 20,
    barre1: 40,
    barre2: 60,
    losange: 80,
    mini: 0,
    maxi: 100,
    filePath: path.join(outputDir, 'exemple7-tofile.png'),
  })
  console.log('   -> Résultat:', result)
  console.log('')

  // Exemple 8 : Valeurs partielles (certaines null)
  console.log('8. Valeurs partielles (seulement rond et barre1)')
  const buffer8 = await tiboGrafplot({
    rond: 35,
    barre1: 70,
    barre2: null,
    losange: null,
    mini: 0,
    maxi: 100,
  })
  await fs.writeFile(path.join(outputDir, 'exemple8-partiel.png'), buffer8)
  console.log('   -> exemple8-partiel.png créé\n')

  // Exemple 9 : Z-Index personnalisé
  console.log('9. Z-Index personnalisé (losange au premier plan)')
  const buffer9 = await tiboGrafplot({
    rond: 50,
    barre1: 50,
    barre2: 50,
    losange: 50,
    mini: 0,
    maxi: 100,
    zIndex: {
      rond: 4,
      barre1: 3,
      barre2: 2,
      losange: 1,
    },
  })
  await fs.writeFile(path.join(outputDir, 'exemple9-zindex.png'), buffer9)
  console.log('   -> exemple9-zindex.png créé\n')

  console.log('=== Tous les exemples générés dans ./examples/output/ ===')
}

main().catch(console.error)
