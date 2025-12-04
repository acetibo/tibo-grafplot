/**
 * tibo-grafplot - Helpers Express/Pug
 *
 * Facilite l'intégration dans les applications Express avec templates Pug
 */

const tiboGrafplot = require('./index')
const path = require('path')
const fs = require('fs').promises

/**
 * Middleware Express pour ajouter les helpers Pug
 *
 * Usage dans app.js:
 *   const { pugHelpers } = require('tibo-grafplot/express')
 *   app.use(pugHelpers())
 *
 * Usage dans Pug:
 *   img(src=await grafplot({ rond: 50, barre1: 70, mini: 0, maxi: 100 }))
 *   != await grafplotSvg({ rond: 50, barre1: 70, mini: 0, maxi: 100 })
 */
function pugHelpers(options = {}) {
  const defaultConfig = options.defaultConfig || {}

  return (req, res, next) => {
    // Helper pour générer une image base64 (pour <img src="...">)
    res.locals.grafplot = async (data) => {
      return await tiboGrafplot({
        ...defaultConfig,
        ...data,
        output: 'base64'
      })
    }

    // Helper pour générer une image JPEG base64
    res.locals.grafplotJpeg = async (data) => {
      return await tiboGrafplot({
        ...defaultConfig,
        ...data,
        output: 'jpeg-base64'
      })
    }

    // Helper pour générer un SVG inline
    res.locals.grafplotSvg = async (data) => {
      return await tiboGrafplot({
        ...defaultConfig,
        ...data,
        output: 'svg'
      })
    }

    next()
  }
}

/**
 * Crée une route Express pour servir des graphiques dynamiquement
 *
 * Usage:
 *   const { createRoute } = require('tibo-grafplot/express')
 *   app.use('/grafplot', createRoute())
 *
 * Appel:
 *   GET /grafplot?rond=50&barre1=70&mini=0&maxi=100&format=png
 *   GET /grafplot?rond=50&barre1=70&format=svg
 */
function createRoute(options = {}) {
  const router = require('express').Router()
  const defaultConfig = options.defaultConfig || {}

  router.get('/', async (req, res) => {
    try {
      const {
        rond, barre1, barre2, losange, mini, maxi,
        width, height, barWidth,
        format = 'png',
        quality = '0.9',
        // Couleurs (préfixées par c_)
        c_background, c_rond, c_barre1, c_barre2, c_losange
      } = req.query

      const data = {
        ...defaultConfig,
        rond: rond !== undefined ? parseFloat(rond) : undefined,
        barre1: barre1 !== undefined ? parseFloat(barre1) : undefined,
        barre2: barre2 !== undefined ? parseFloat(barre2) : undefined,
        losange: losange !== undefined ? parseFloat(losange) : undefined,
        mini: mini !== undefined ? parseFloat(mini) : 0,
        maxi: maxi !== undefined ? parseFloat(maxi) : 100,
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        barWidth: barWidth ? parseInt(barWidth) : undefined,
        jpegQuality: parseFloat(quality),
      }

      // Couleurs personnalisées
      if (c_background || c_rond || c_barre1 || c_barre2 || c_losange) {
        data.colors = {}
        if (c_background) data.colors.background = `#${c_background}`
        if (c_rond) data.colors.rond = `#${c_rond}`
        if (c_barre1) data.colors.barre1 = `#${c_barre1}`
        if (c_barre2) data.colors.barre2 = `#${c_barre2}`
        if (c_losange) data.colors.losange = `#${c_losange}`
      }

      let result
      let contentType

      switch (format.toLowerCase()) {
        case 'svg':
          result = await tiboGrafplot({ ...data, output: 'svg' })
          contentType = 'image/svg+xml'
          break
        case 'jpeg':
        case 'jpg':
          result = await tiboGrafplot({ ...data, output: 'jpeg' })
          contentType = 'image/jpeg'
          break
        case 'png':
        default:
          result = await tiboGrafplot({ ...data, output: 'buffer' })
          contentType = 'image/png'
          break
      }

      res.set('Content-Type', contentType)
      res.set('Cache-Control', 'public, max-age=86400') // Cache 24h
      res.send(result)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

/**
 * Génère un graphique pour publipostage
 * Retourne un objet avec plusieurs formats pour choisir le plus adapté
 *
 * Usage:
 *   const { generateForMailing } = require('tibo-grafplot/express')
 *   const graph = await generateForMailing({ rond: 50, barre1: 70, mini: 0, maxi: 100 })
 *   // graph.base64 -> pour <img src="...">
 *   // graph.svg -> pour SVG inline
 *   // graph.buffer -> pour sauvegarder en fichier
 */
async function generateForMailing(data, options = {}) {
  const config = { ...options, ...data }

  const [base64, svg, buffer] = await Promise.all([
    tiboGrafplot({ ...config, output: 'base64' }),
    tiboGrafplot({ ...config, output: 'svg' }),
    tiboGrafplot({ ...config, output: 'buffer' }),
  ])

  return {
    base64,      // Pour <img src="data:image/png;base64,...">
    svg,         // Pour SVG inline (le plus léger)
    buffer,      // Pour sauvegarder en fichier
    // Helpers pour Pug
    imgTag: `<img src="${base64}" alt="Graphique" />`,
    svgInline: svg,
  }
}

/**
 * Génère plusieurs graphiques en batch (pour publipostage)
 *
 * Usage:
 *   const graphs = await generateBatch([
 *     { id: 'graph1', rond: 50, barre1: 70, mini: 0, maxi: 100 },
 *     { id: 'graph2', rond: 30, barre1: 60, mini: 0, maxi: 100 },
 *   ])
 *   // graphs['graph1'].base64
 *   // graphs['graph2'].svg
 */
async function generateBatch(items, options = {}) {
  const results = {}

  await Promise.all(
    items.map(async (item) => {
      const { id, ...data } = item
      const key = id || `graph_${Object.keys(results).length}`
      results[key] = await generateForMailing(data, options)
    })
  )

  return results
}

/**
 * Sauvegarde un batch de graphiques dans un dossier
 *
 * Usage:
 *   await saveBatchToFiles([
 *     { filename: 'graph1.png', rond: 50, barre1: 70, mini: 0, maxi: 100 },
 *     { filename: 'graph2.svg', rond: 30, barre1: 60, mini: 0, maxi: 100 },
 *   ], './output')
 */
async function saveBatchToFiles(items, outputDir, options = {}) {
  await fs.mkdir(outputDir, { recursive: true })

  const results = []

  for (const item of items) {
    const { filename, ...data } = item
    const filePath = path.join(outputDir, filename)

    const result = await tiboGrafplot({
      ...options,
      ...data,
      output: 'file',
      filePath,
    })

    results.push(result)
  }

  return results
}

module.exports = {
  pugHelpers,
  createRoute,
  generateForMailing,
  generateBatch,
  saveBatchToFiles,
}
