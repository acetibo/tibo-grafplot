/**
 * tibo-grafplot
 * Module standalone de génération de graphiques avec formes géométriques
 *
 * @author Thibaud Bouillie
 * @license MIT
 */

const { createCanvas } = require('canvas')
const fs = require('fs').promises
const path = require('path')

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  width: 620,
  height: 28,
  barWidth: 4,
  colors: {
    background: '#FFFFFF',
    rond: '#f7c948',
    barre1: '#3d6b3d',
    barre2: '#e74c3c',
    losange: '#ff8c00',
  },
  zIndex: {
    rond: 1,
    losange: 2,
    barre1: 3,
    barre2: 4,
  },
}

/**
 * Normalise une valeur numérique
 * @param {any} valeur - Valeur à normaliser
 * @returns {number|null} - Valeur normalisée ou null
 */
function normaliserValeur(valeur) {
  if (
    valeur === undefined ||
    valeur === null ||
    ['nd', 'nc', '#nd', '#n/d', '/'].includes(String(valeur).toLowerCase()) ||
    [1000000000, 999999999, 88888900, 88888888].includes(Number(valeur))
  ) {
    return null
  }
  try {
    const valeurStr = String(valeur).replace(/,/g, '.').replace(/\s/g, '')
    const valeurNum = parseFloat(valeurStr)
    return isNaN(valeurNum) ? null : valeurNum
  } catch (e) {
    return null
  }
}

/**
 * Dessine un losange sur le canvas
 */
function drawLosange(ctx, x, y, size, couleur) {
  ctx.beginPath()
  ctx.moveTo(x, y - size / 2)
  ctx.lineTo(x + size / 2, y)
  ctx.lineTo(x, y + size / 2)
  ctx.lineTo(x - size / 2, y)
  ctx.closePath()
  ctx.fillStyle = couleur
  ctx.fill()
  ctx.strokeStyle = '#808080'
  ctx.lineWidth = 1
  ctx.stroke()
}

/**
 * Dessine un cercle sur le canvas
 */
function drawCercle(ctx, x, y, radius, couleur) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = couleur
  ctx.fill()
  ctx.strokeStyle = '#808080'
  ctx.lineWidth = 1
  ctx.stroke()
}

/**
 * Dessine une barre verticale sur le canvas
 * @param {CanvasRenderingContext2D} ctx - Contexte du canvas
 * @param {number} x - Position X
 * @param {number} barHeight - Hauteur de la barre
 * @param {number} barWidth - Largeur de la barre
 * @param {string} couleur - Couleur de la barre
 * @param {number} yOffset - Décalage vertical (0 = haut, défaut)
 */
function drawBarre(ctx, x, barHeight, barWidth, couleur, yOffset = 0) {
  ctx.fillStyle = couleur
  ctx.fillRect(x - barWidth / 2, yOffset, barWidth, barHeight)
}

/**
 * Génère un SVG du graphique
 * @param {Object} data - Données du graphique
 * @param {Object} config - Configuration
 * @returns {string} - Contenu SVG
 */
function generateSVG(data, config) {
  const { width, height, barWidth, colors, zIndex } = config

  // Normalisation des valeurs
  const valeurs = {
    mini: normaliserValeur(data.mini) ?? 0,
    maxi: normaliserValeur(data.maxi) ?? 100,
    rond: normaliserValeur(data.rond),
    barre1: normaliserValeur(data.barre1),
    barre2: normaliserValeur(data.barre2),
    losange: normaliserValeur(data.losange),
  }

  if (valeurs.mini >= valeurs.maxi) {
    valeurs.mini = 0
    valeurs.maxi = 100
  }
  const amplitude = valeurs.maxi - valeurs.mini

  const getXPosition = (val) => {
    if (val === null || val === undefined) return null
    if (val < valeurs.mini || val > valeurs.maxi) return null
    const relativePos = (val - valeurs.mini) / amplitude
    return Math.round(width * relativePos)
  }

  let x_rond = getXPosition(valeurs.rond)
  let x_losange = getXPosition(valeurs.losange)
  let x_barre1 = getXPosition(valeurs.barre1)
  let x_barre2 = getXPosition(valeurs.barre2)

  const radius = height / 2 - 1
  const losangeSize = height - 2

  // Détection égalité stricte des barres
  const barresEgales = valeurs.barre1 !== null &&
                       valeurs.barre2 !== null &&
                       valeurs.barre1 === valeurs.barre2

  // Gestion collisions barres
  const minDistance = barWidth
  if (x_barre1 !== null && x_barre2 !== null && !barresEgales) {
    let distance = Math.abs(x_barre1 - x_barre2)
    if (distance < minDistance) {
      const center = (x_barre1 + x_barre2) / 2
      if (x_barre1 <= x_barre2) {
        x_barre1 = center - minDistance / 2
        x_barre2 = center + minDistance / 2
      } else {
        x_barre1 = center + minDistance / 2
        x_barre2 = center - minDistance / 2
      }
    }
    const groupMin = Math.min(x_barre1, x_barre2)
    const groupMax = Math.max(x_barre1, x_barre2)
    if (groupMin < barWidth / 2) {
      const decalage = barWidth / 2 - groupMin
      x_barre1 += decalage
      x_barre2 += decalage
    }
    if (groupMax > width - barWidth / 2) {
      const decalage = groupMax - (width - barWidth / 2)
      x_barre1 -= decalage
      x_barre2 -= decalage
    }
  } else {
    if (x_barre1 !== null) {
      if (x_barre1 < barWidth / 2) x_barre1 = barWidth / 2
      if (x_barre1 > width - barWidth / 2) x_barre1 = width - barWidth / 2
    }
    if (x_barre2 !== null) {
      if (x_barre2 < barWidth / 2) x_barre2 = barWidth / 2
      if (x_barre2 > width - barWidth / 2) x_barre2 = width - barWidth / 2
    }
  }

  // Clamping rond et losange
  if (x_rond !== null) {
    if (x_rond < radius) x_rond = radius
    if (x_rond > width - radius) x_rond = width - radius
  }
  if (x_losange !== null) {
    if (x_losange < losangeSize / 2) x_losange = losangeSize / 2
    if (x_losange > width - losangeSize / 2) x_losange = width - losangeSize / 2
  }

  // Construction du SVG
  const elements = []

  // Fond
  elements.push(`<rect width="${width}" height="${height}" fill="${colors.background}"/>`)

  // Éléments ordonnés par z-index
  const drawables = []

  if (x_rond !== null) {
    drawables.push({
      z: zIndex.rond,
      svg: `<circle cx="${x_rond}" cy="${height / 2}" r="${radius}" fill="${colors.rond}" stroke="#808080" stroke-width="1"/>`
    })
  }

  if (x_losange !== null) {
    const cy = height / 2
    const halfSize = losangeSize / 2
    const points = `${x_losange},${cy - halfSize} ${x_losange + halfSize},${cy} ${x_losange},${cy + halfSize} ${x_losange - halfSize},${cy}`
    drawables.push({
      z: zIndex.losange,
      svg: `<polygon points="${points}" fill="${colors.losange}" stroke="#808080" stroke-width="1"/>`
    })
  }

  if (barresEgales) {
    const halfHeight = height / 2
    drawables.push({
      z: zIndex.barre1,
      svg: `<rect x="${x_barre1 - barWidth / 2}" y="0" width="${barWidth}" height="${halfHeight}" fill="${colors.barre1}"/>`
    })
    drawables.push({
      z: zIndex.barre2,
      svg: `<rect x="${x_barre2 - barWidth / 2}" y="${halfHeight}" width="${barWidth}" height="${halfHeight}" fill="${colors.barre2}"/>`
    })
  } else {
    if (x_barre1 !== null) {
      drawables.push({
        z: zIndex.barre1,
        svg: `<rect x="${x_barre1 - barWidth / 2}" y="0" width="${barWidth}" height="${height}" fill="${colors.barre1}"/>`
      })
    }
    if (x_barre2 !== null) {
      drawables.push({
        z: zIndex.barre2,
        svg: `<rect x="${x_barre2 - barWidth / 2}" y="0" width="${barWidth}" height="${height}" fill="${colors.barre2}"/>`
      })
    }
  }

  drawables.sort((a, b) => a.z - b.z)
  drawables.forEach(item => elements.push(item.svg))

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${elements.join('\n')}
</svg>`
}

/**
 * Rend le graphique sur le canvas
 */
function renderCanvas(canvas, data, config) {
  const { width, height, barWidth, colors, zIndex } = config
  const ctx = canvas.getContext('2d')

  // 1. Normalisation des valeurs
  const valeurs = {
    mini: normaliserValeur(data.mini) ?? 0,
    maxi: normaliserValeur(data.maxi) ?? 100,
    rond: normaliserValeur(data.rond),
    barre1: normaliserValeur(data.barre1),
    barre2: normaliserValeur(data.barre2),
    losange: normaliserValeur(data.losange),
  }

  // Validation min/max
  if (valeurs.mini >= valeurs.maxi) {
    valeurs.mini = 0
    valeurs.maxi = 100
  }
  const amplitude = valeurs.maxi - valeurs.mini

  // 2. Fond
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, width, height)

  // Helper pour calculer la position X
  const getXPosition = (val) => {
    if (val === null || val === undefined) return null
    if (val < valeurs.mini || val > valeurs.maxi) return null
    const relativePos = (val - valeurs.mini) / amplitude
    return Math.round(width * relativePos)
  }

  // 3. Calcul des positions
  let x_rond = getXPosition(valeurs.rond)
  let x_losange = getXPosition(valeurs.losange)
  let x_barre1 = getXPosition(valeurs.barre1)
  let x_barre2 = getXPosition(valeurs.barre2)

  const radius = height / 2 - 1
  const losangeSize = height - 2

  // Détection de l'égalité stricte des valeurs des barres
  const barresEgales = valeurs.barre1 !== null &&
                       valeurs.barre2 !== null &&
                       valeurs.barre1 === valeurs.barre2

  // Gestion des collisions entre barres (sauf si égalité stricte -> empilées)
  const minDistance = barWidth
  if (x_barre1 !== null && x_barre2 !== null && !barresEgales) {
    let distance = Math.abs(x_barre1 - x_barre2)
    if (distance < minDistance) {
      const center = (x_barre1 + x_barre2) / 2
      if (x_barre1 <= x_barre2) {
        x_barre1 = center - minDistance / 2
        x_barre2 = center + minDistance / 2
      } else {
        x_barre1 = center + minDistance / 2
        x_barre2 = center - minDistance / 2
      }
    }
    // Gestion des bords
    const groupMin = Math.min(x_barre1, x_barre2)
    const groupMax = Math.max(x_barre1, x_barre2)
    if (groupMin < barWidth / 2) {
      const decalage = barWidth / 2 - groupMin
      x_barre1 += decalage
      x_barre2 += decalage
    }
    if (groupMax > width - barWidth / 2) {
      const decalage = groupMax - (width - barWidth / 2)
      x_barre1 -= decalage
      x_barre2 -= decalage
    }
  } else {
    if (x_barre1 !== null) {
      if (x_barre1 < barWidth / 2) x_barre1 = barWidth / 2
      if (x_barre1 > width - barWidth / 2) x_barre1 = width - barWidth / 2
    }
    if (x_barre2 !== null) {
      if (x_barre2 < barWidth / 2) x_barre2 = barWidth / 2
      if (x_barre2 > width - barWidth / 2) x_barre2 = width - barWidth / 2
    }
  }

  // Clamping du rond
  if (x_rond !== null) {
    if (x_rond < radius) x_rond = radius
    if (x_rond > width - radius) x_rond = width - radius
  }

  // Clamping du losange
  if (x_losange !== null) {
    if (x_losange < losangeSize / 2) x_losange = losangeSize / 2
    if (x_losange > width - losangeSize / 2) x_losange = width - losangeSize / 2
  }

  // 4. Dessin ordonné par Z-Index
  const drawables = []

  if (x_rond !== null) {
    drawables.push({
      z: zIndex.rond,
      draw: () => drawCercle(ctx, x_rond, height / 2, radius, colors.rond),
    })
  }
  if (x_losange !== null) {
    drawables.push({
      z: zIndex.losange,
      draw: () => drawLosange(ctx, x_losange, height / 2, losangeSize, colors.losange),
    })
  }
  // Barres : empilées si égalité stricte, sinon normales
  if (barresEgales) {
    // Barres empilées : chacune fait la moitié de la hauteur
    const halfHeight = height / 2
    drawables.push({
      z: zIndex.barre1,
      draw: () => drawBarre(ctx, x_barre1, halfHeight, barWidth, colors.barre1, 0),
    })
    drawables.push({
      z: zIndex.barre2,
      draw: () => drawBarre(ctx, x_barre2, halfHeight, barWidth, colors.barre2, halfHeight),
    })
  } else {
    if (x_barre1 !== null) {
      drawables.push({
        z: zIndex.barre1,
        draw: () => drawBarre(ctx, x_barre1, height, barWidth, colors.barre1, 0),
      })
    }
    if (x_barre2 !== null) {
      drawables.push({
        z: zIndex.barre2,
        draw: () => drawBarre(ctx, x_barre2, height, barWidth, colors.barre2, 0),
      })
    }
  }

  drawables.sort((a, b) => a.z - b.z)
  drawables.forEach((item) => item.draw())

  return canvas
}

/**
 * Génère un graphique
 *
 * @param {Object} options - Options de génération
 * @param {number} options.rond - Valeur du rond (cercle)
 * @param {number} options.barre1 - Valeur de la barre 1
 * @param {number} options.barre2 - Valeur de la barre 2
 * @param {number} options.losange - Valeur du losange
 * @param {number} options.mini - Valeur minimum de l'échelle (défaut: 0)
 * @param {number} options.maxi - Valeur maximum de l'échelle (défaut: 100)
 * @param {number} [options.width] - Largeur du graphique (défaut: 620)
 * @param {number} [options.height] - Hauteur du graphique (défaut: 28)
 * @param {Object} [options.colors] - Couleurs personnalisées
 * @param {Object} [options.zIndex] - Z-index personnalisés
 * @param {string} [options.output] - Type de sortie: 'buffer' | 'base64' | 'file' | 'jpeg' | 'jpeg-base64' | 'svg'
 * @param {string} [options.filePath] - Chemin du fichier (requis si output='file')
 * @param {number} [options.jpegQuality] - Qualité JPEG de 0 à 1 (défaut: 0.9)
 *
 * @returns {Promise<Buffer|string|Object>} - Selon le type de sortie
 */
async function tiboGrafplot(options = {}) {
  // Extraction des données
  const data = {
    rond: options.rond,
    barre1: options.barre1,
    barre2: options.barre2,
    losange: options.losange,
    mini: options.mini ?? 0,
    maxi: options.maxi ?? 100,
  }

  // Fusion de la configuration
  const config = {
    width: options.width ?? DEFAULT_CONFIG.width,
    height: options.height ?? DEFAULT_CONFIG.height,
    barWidth: options.barWidth ?? DEFAULT_CONFIG.barWidth,
    colors: { ...DEFAULT_CONFIG.colors, ...options.colors },
    zIndex: { ...DEFAULT_CONFIG.zIndex, ...options.zIndex },
  }

  // Création du canvas
  const canvas = createCanvas(config.width, config.height)
  renderCanvas(canvas, data, config)

  // Type de sortie
  const output = options.output ?? 'buffer'
  const jpegQuality = options.jpegQuality ?? 0.9

  switch (output) {
    // PNG Buffer
    case 'buffer':
    case 'png':
      return canvas.toBuffer('image/png')

    // PNG Base64
    case 'base64':
    case 'png-base64':
      const pngBuffer = canvas.toBuffer('image/png')
      return `data:image/png;base64,${pngBuffer.toString('base64')}`

    // JPEG Buffer
    case 'jpeg':
    case 'jpg':
      return canvas.toBuffer('image/jpeg', { quality: jpegQuality })

    // JPEG Base64
    case 'jpeg-base64':
    case 'jpg-base64':
      const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: jpegQuality })
      return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`

    // SVG (génération manuelle)
    case 'svg':
      return generateSVG(data, config)

    // Fichier (détecte le format selon l'extension)
    case 'file':
      if (!options.filePath) {
        throw new Error("L'option 'filePath' est requise pour output='file'")
      }
      const ext = path.extname(options.filePath).toLowerCase()
      let fileBuffer
      let mimeType = 'image/png'

      if (ext === '.jpg' || ext === '.jpeg') {
        fileBuffer = canvas.toBuffer('image/jpeg', { quality: jpegQuality })
        mimeType = 'image/jpeg'
      } else if (ext === '.svg') {
        const svgContent = generateSVG(data, config)
        await fs.writeFile(options.filePath, svgContent)
        const stats = await fs.stat(options.filePath)
        return {
          filename: path.basename(options.filePath),
          path: options.filePath,
          size: stats.size,
          width: config.width,
          height: config.height,
          format: 'svg',
        }
      } else {
        fileBuffer = canvas.toBuffer('image/png')
      }

      await fs.writeFile(options.filePath, fileBuffer)
      const stats = await fs.stat(options.filePath)
      return {
        filename: path.basename(options.filePath),
        path: options.filePath,
        size: stats.size,
        width: config.width,
        height: config.height,
        format: ext.replace('.', '') || 'png',
      }

    default:
      throw new Error(`Type de sortie inconnu: ${output}`)
  }
}

/**
 * Génère un graphique et retourne un Buffer PNG
 * Raccourci pour tiboGrafplot({ ...options, output: 'buffer' })
 */
async function toBuffer(options) {
  return tiboGrafplot({ ...options, output: 'buffer' })
}

/**
 * Génère un graphique et retourne une Data URL base64
 * Raccourci pour tiboGrafplot({ ...options, output: 'base64' })
 */
async function toBase64(options) {
  return tiboGrafplot({ ...options, output: 'base64' })
}

/**
 * Génère un graphique et l'enregistre dans un fichier
 * Raccourci pour tiboGrafplot({ ...options, output: 'file' })
 */
async function toFile(options) {
  return tiboGrafplot({ ...options, output: 'file' })
}

// Exports
module.exports = tiboGrafplot
module.exports.tiboGrafplot = tiboGrafplot
module.exports.toBuffer = toBuffer
module.exports.toBase64 = toBase64
module.exports.toFile = toFile
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG
