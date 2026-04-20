# ggallery 🏺

![ggallery hero image](file:///Users/micah/.gemini/antigravity/brain/0e19a027-c3db-4ba2-aadf-12fdcb5cb626/ggallery_hero_view_1776706308686.png)

**Turn a folder of 3D sculptures into a navigable, web-ready virtual gallery — no coding required.**

`ggallery` is an opinionated, open-source template for museums and digital archivists. It bridges the gap between high-fidelity photogrammetry scans and public-facing web experiences. By combining a YAML-driven configuration with an automated 3D optimization pipeline, `ggallery` allows you to deploy a spatial virtual tour of your collection in minutes.

---

## ✨ Features

- 🏛️ **Spatial Experience**: Not just a grid of models. A navigable 3D hall with curated lighting and pedestals.
- ⚙️ **YAML-First Config**: Manage your entire exhibition (sculptures, metadata, and themes) in a single `gallery/gallery.yaml` file.
- 🚀 **Automated Optimization**: Built-in asset pipeline that simplifies meshes and compresses textures for fast web loading.
- 📱 **Mobile & Desktop Ready**: Responsive waypoint navigation that works seamlessly on touch devices and laptops.
- ♿ **Accessibility First**: Keyboard-friendly navigation and screen-reader support for labels.
- 🌍 **Deploy Anywhere**: Produces a lightweight static bundle for GitHub Pages, Vercel, Netlify, or institutional servers.

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **3D Engine**: [Three.js](https://threejs.org/) via [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber)
- **3D Utilities**: [`@react-three/drei`](https://github.com/pmndrs/drei)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Asset Pipeline**: [`glTF-Transform`](https://gltf-transform.donmccurdy.com/) + [`meshoptimizer`](https://github.com/zeux/meshoptimizer)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-org/ggallery.git
cd ggallery
npm install
```

### 2. Add Your Models
Drop your `.glb` or `.gltf` photogrammetry scans into the `gallery/` directory.

### 3. Configure Your Gallery
Edit `gallery/gallery.yaml` to list your sculptures and set their metadata:

```yaml
# gallery/gallery.yaml
metadata:
  title: "Ancient Sculpture Collection"
  institution: "National Digital Museum"

sculptures:
  - file: "venus_de_milo.glb"
    title: "Venus de Milo"
    artist: "Alexandros of Antioch"
    date: "c. 130 – 100 BCE"
    description: "One of the most famous pieces of ancient Greek sculpture."
```

### 4. Optimize & Run
```bash
# Compress your models for the web
npm run optimize

# Start local preview
npm run dev
```

### 5. Build & Deploy
```bash
npm run build
```
Upload the contents of the `dist/` folder to any static host.

---

## 📦 Asset Pipeline

High-fidelity photogrammetry scans are often too large for the web. `ggallery` includes a built-in optimization tool:

```bash
npm run optimize
```

This script:
- Simplifies high-poly meshes to a target triangle count.
- Compresses textures to modern WebP formats.
- Applies Draco or Meshopt compression for fast delivery.

Original files in `gallery/` are preserved; the system automatically builds from the cached, optimized versions.

---

## 🗺️ Roadmap

- [ ] **v0.2**: Free-roam WASD/Joytick navigation.
- [ ] **v0.2**: Support for multiple room templates (Rotunda, Outdoor Park).
- [ ] **v0.3**: Audio guide integration per sculpture.
- [ ] **v0.3**: Multilingual label support.
- [ ] **v1.0**: WebXR / VR support for Head-Mounted Displays.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for digital heritage preservation.**
Find a bug? Open an [issue](https://github.com/micahgbrg/ggallery/issues).
