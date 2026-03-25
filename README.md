# Particle Morphing System (WebGPU) — SVG Edition

Système de particules interactif qui morphe entre des formes 2D définies par des **fichiers SVG**, entièrement piloté par GPU via **WebGPU** et **Three.js TSL** (Three Shader Language).

**Objectif** : devenir un outil web déployé, permettant à n'importe qui d'importer ses propres SVG par drag & drop, de personnaliser les couleurs et de lancer une animation de morphing en quelques clics.

---

## Aperçu

Les particules se regroupent organiquement pour former des formes 2D extraites de fichiers SVG. Elles transitionnent d'une forme à l'autre avec un effet d'explosion/reconstruction paramétrable. Le nombre de formes (et donc de transitions) est dynamique : il correspond au nombre de SVG chargés.

---

## Stack technique

| Technologie | Rôle |
|---|---|
| **Three.js** (v0.178+) | Moteur 3D, WebGPU renderer |
| **TSL** (Three Shader Language) | Shaders GPU (compute + material) |
| **WebGPU** | Backend de rendu et compute shaders |
| **TypeScript** | Langage principal |
| **Vite** | Build tool / dev server |
| **Tweakpane** | UI de debug (paramètres temps réel) |

---

## Architecture

```
src/
├── main.ts                  # Point d'entrée
├── demo.ts                  # Scène, caméra, chargement SVG, génération des formes, contrôles
├── ParticlesMesh.ts         # Système de particules GPU (compute shaders, buffers, rendu)
├── style.css                # Styles de base
└── utils/
    ├── Pointer.ts           # Gestion du pointeur souris → coordonnées monde
    ├── svgParser.ts         # Chargement SVG → rasterisation → échantillonnage de points
    └── nodes/
        └── noise/
            ├── curlNoise4d.ts      # Curl noise 4D (mouvement organique)
            └── simplexNoise3d.ts   # Simplex noise 3D (base du curl noise)

asset/
├── 1.svg
├── 2.svg
├── 4.svg
└── 5.svg                    # 4 formes SVG incluses par défaut
```

---

## Fonctionnement

### Pipeline SVG → Particules

1. **Chargement** : les fichiers SVG du dossier `asset/` sont chargés au démarrage via `import.meta.glob`
2. **Rasterisation** : chaque SVG est rendu sur un canvas 2D (512×512), les pixels sont analysés pour détecter bords et remplissage
3. **Échantillonnage** : des points sont distribués aléatoirement sur les zones détectées pour obtenir un nombre fixe de positions par forme
4. **Buffer GPU** : toutes les positions sont stockées dans un buffer GPU unique (flattened) : `[forme0, forme1, forme2, ...]`
5. **Compute shader** : à chaque frame, le shader calcule la position cible via `instanceIndex + activeIndex × amount` et anime les particules

### Compute shader (GPU)

Le compute shader (`ParticlesMesh.ts`) s'exécute par particule et gère :

- **Ciblage** : direction vers la position de base de la forme active
- **Curl noise** : mouvement organique continu (wiggle)
- **Burst** : force d'explosion radiale (scatter → reconstruction)
- **Vélocité** : combinaison normalisée de toutes les forces

### Rendu

- `InstancedMesh` + `SpriteNodeMaterial` avec alpha radial
- Background blanc (`#FFFFFF`), blending `NormalBlending`
- DPR capé à 1.5 pour la performance

---

## Paramètres actuels (Tweakpane)

### Auto Loop
- **actif** : active/désactive la boucle automatique de morphing
- **délai (ms)** : temps entre chaque transition (500–8000ms)

### Particles
- **wigglePower** : amplitude du mouvement organique (0–0.7)
- **wiggleSpeed** : vitesse du curl noise (0–3)
- **baseParticleScale** : taille des particules (0.1–3)

### Explosion
- **taille explosion** : force de dispersion initiale (burstStrength)
- **vitesse explosion** : durée de la phase d'éclatement
- **vitesse reconstruction** : rapidité du regroupement vers la forme cible

---

## Couleurs

Chaque forme possède son propre dégradé de couleurs (paire de couleurs), configurable dans le code via les palettes définies dans `demo.ts`.

---

## Lancer le projet

```bash
npm install
npm run dev
```

Le projet tourne sur `http://localhost:5173/`.

---

## Ajouter une forme (actuellement)

1. Placer un fichier `.svg` dans le dossier `asset/`
2. Relancer le dev server
3. La nouvelle forme est automatiquement intégrée à la boucle de morphing

---

## Roadmap — Vers un outil web public

Ce projet va évoluer d'une démo technique vers un **outil web déployé** accessible à tous. Voici les fonctionnalités prévues :

### Phase 1 — Drag & Drop de SVG
- [ ] Zone de drag & drop permettant aux utilisateurs d'importer leurs propres fichiers SVG
- [ ] Parsing et validation des SVG côté client en temps réel
- [ ] Ajout dynamique des nouvelles formes à la boucle d'animation (sans rechargement)
- [ ] Gestion de la liste des formes chargées (réordonner, supprimer)

### Phase 2 — Panneau de contrôle avancé
- [ ] UI complète remplaçant le panneau Tweakpane de debug
- [ ] Contrôles intuitifs pour lancer / mettre en pause / réinitialiser l'animation
- [ ] Réglages avancés de l'explosion, de la reconstruction et du mouvement organique
- [ ] Prévisualisation des formes avant lancement

### Phase 3 — Personnalisation des couleurs
- [ ] Color picker pour choisir les variations de couleurs par forme
- [ ] Palettes prédéfinies sélectionnables
- [ ] Possibilité de définir des dégradés personnalisés (couleur A → couleur B par forme)
- [ ] Aperçu en temps réel des changements de couleur

### Phase 4 — Déploiement web
- [ ] Build de production optimisé
- [ ] Déploiement sur une plateforme (Vercel, Netlify, ou autre)
- [ ] UI responsive (desktop + mobile)
- [ ] Fallback ou message d'erreur pour les navigateurs sans WebGPU

---

## Contraintes techniques

- **Tout le calcul de simulation est GPU** (compute shaders TSL) — aucune logique de particule sur CPU
- **`InstancedMesh`** pour le rendu performant de milliers de particules
- **`StorageBufferNode`** pour les buffers GPU (positions, vélocités, couleurs)
- **Formes 2D uniquement** — les SVG sont projetés sur un plan face caméra
- **WebGPU requis** — Chrome 113+, Edge 113+, ou navigateur compatible
