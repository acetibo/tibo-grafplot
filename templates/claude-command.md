# Installer tibo-grafplot

Installe le module tibo-grafplot et met à jour la documentation du projet.

## Instructions pour Claude

1. **Installer le package npm** :
   ```bash
   npm install github:acetibo/tibo-grafplot
   ```

2. **Mettre à jour le fichier contexte.md** (ou créer une section si le fichier existe) avec les informations suivantes :

   ```markdown
   ## 📦 Module tibo-grafplot

   **Installation** : `npm install github:acetibo/tibo-grafplot`
   **Repository** : https://github.com/acetibo/tibo-grafplot

   ### Utilisation

   ```javascript
   const tiboGrafplot = require('tibo-grafplot')

   // Générer un graphique PNG
   const buffer = await tiboGrafplot({
     rond: 45.5,      // Valeur du cercle
     barre1: 67.2,    // Valeur barre 1
     barre2: 52.0,    // Valeur barre 2
     losange: 38.8,   // Valeur losange (optionnel)
     mini: 0,         // Échelle min
     maxi: 100        // Échelle max
   })
   ```

   ### Formats de sortie disponibles
   - `buffer` / `png` : Buffer PNG (défaut)
   - `base64` : PNG en base64 pour `<img src="...">`
   - `jpeg` : Buffer JPEG
   - `svg` : SVG vectoriel (très léger)
   - `file` : Fichier (auto-détecte le format)

   ### Paramètres configurables
   - `width` (défaut: 620) : Largeur en pixels
   - `height` (défaut: 28) : Hauteur en pixels
   - `barWidth` (défaut: 4) : Épaisseur des barres
   - `colors` : Couleurs personnalisées
   - `jpegQuality` (défaut: 0.9) : Qualité JPEG

   ### Intégration Express/Pug
   ```javascript
   const { pugHelpers } = require('tibo-grafplot/express')
   app.use(pugHelpers())

   // Dans Pug : img(src=await grafplot({ rond: 50, barre1: 70, mini: 0, maxi: 100 }))
   ```
   ```

3. **Confirmer l'installation** en affichant :
   - La version installée (depuis package.json)
   - Le chemin du fichier contexte.md mis à jour

## Notes

- Si contexte.md n'existe pas, créer une section "Dépendances" ou similaire
- Ne pas écraser le contenu existant, ajouter la section à la fin
- Vérifier que canvas est installé (dépendance de tibo-grafplot)

---

## Installation de cette commande

Copiez ce fichier dans votre projet :

```bash
mkdir -p .claude/commands
cp node_modules/tibo-grafplot/templates/claude-command.md .claude/commands/install-grafplot.md
```

Puis utilisez `/install-grafplot` dans Claude Code.
