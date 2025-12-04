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
 * Rend le graphique sur le canvas
 */
function renderCanvas(canvas, data, config) {
  const { width, height, colors, zIndex } = config
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

  const barWidth = 4
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
 * @param {string} [options.output] - Type de sortie: 'buffer' | 'base64' | 'file'
 * @param {string} [options.filePath] - Chemin du fichier (requis si output='file')
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
    colors: { ...DEFAULT_CONFIG.colors, ...options.colors },
    zIndex: { ...DEFAULT_CONFIG.zIndex, ...options.zIndex },
  }

  // Création du canvas
  const canvas = createCanvas(config.width, config.height)
  renderCanvas(canvas, data, config)

  // Type de sortie
  const output = options.output ?? 'buffer'

  switch (output) {
    case 'buffer':
      return canvas.toBuffer('image/png')

    case 'base64':
      const buffer = canvas.toBuffer('image/png')
      return `data:image/png;base64,${buffer.toString('base64')}`

    case 'file':
      if (!options.filePath) {
        throw new Error("L'option 'filePath' est requise pour output='file'")
      }
      const fileBuffer = canvas.toBuffer('image/png')
      await fs.writeFile(options.filePath, fileBuffer)
      const stats = await fs.stat(options.filePath)
      return {
        filename: path.basename(options.filePath),
        path: options.filePath,
        size: stats.size,
        width: config.width,
        height: config.height,
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
