import * as fs from 'fs';
import * as path from 'path';
// We use dynamic imports or require for Three.js stuff in Node but regular imports work if using tsx.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill for GLTFExporter if it expects some globals, though modern Three.js often works without it.
(global as any).window = global;
(global as any).document = {}; // Minimal polyfill if needed

// Polyfill FileReader which GLTFExporter uses when binary: true
(global as any).FileReader = class {
  onloadend: (() => void) | null = null;
  result: ArrayBuffer | null = null;
  async readAsArrayBuffer(blob: any) {
    this.result = await blob.arrayBuffer();
    if (this.onloadend) this.onloadend();
  }
  async readAsDataURL(blob: any) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    this.result = "data:application/octet-stream;base64," + buffer.toString('base64');
    if (this.onloadend) this.onloadend();
  }
};

async function exportGLB(mesh: THREE.Object3D, filepath: string) {
  const exporter = new GLTFExporter();
  
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      mesh,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          fs.writeFileSync(filepath, Buffer.from(gltf));
          console.log(`Generated ${filepath}`);
          resolve();
        } else {
          // If it didn't output an ArrayBuffer, something went wrong with the binary flag
          reject(new Error("Expected ArrayBuffer from GLTFExporter"));
        }
      },
      (error) => {
        reject(error);
      },
      { binary: true } // Export as GLB
    );
  });
}

async function main() {
  const outDir = path.join(process.cwd(), 'gallery', 'sculptures');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Column (tall cylinder)
  // roughly 1.8m tall
  const columnGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 32);
  const columnMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7, metalness: 0.1 });
  const column = new THREE.Mesh(columnGeom, columnMat);
  column.name = "PlaceholderColumn";
  // The center is at 0, so we elevate it so its base is at y=0 (assuming Origin is at the bottom for placement usually)
  column.position.y = 0.9;
  
  const columnGroup = new THREE.Group();
  columnGroup.add(column);
  
  await exportGLB(columnGroup, path.join(outDir, 'placeholder-column.glb'));

  // 2. Bust (sphere on thin cylinder)
  const neckGeom = new THREE.CylinderGeometry(0.1, 0.15, 0.4, 32);
  const neck = new THREE.Mesh(neckGeom, columnMat);
  neck.position.y = 0.2; // sitting on 0

  const headGeom = new THREE.SphereGeometry(0.3, 32, 32);
  const head = new THREE.Mesh(headGeom, columnMat);
  head.position.y = 0.6; // on top of neck
  
  const bustGroup = new THREE.Group();
  bustGroup.add(neck);
  bustGroup.add(head);
  bustGroup.name = "PlaceholderBust";

  await exportGLB(bustGroup, path.join(outDir, 'placeholder-bust.glb'));

  // 3. Abstract (torus knot)
  const knotGeom = new THREE.TorusKnotGeometry(0.5, 0.15, 100, 16);
  const knot = new THREE.Mesh(knotGeom, columnMat);
  knot.position.y = 0.8; // center is at 0.8
  
  const knotGroup = new THREE.Group();
  knotGroup.add(knot);
  knotGroup.name = "PlaceholderAbstract";

  await exportGLB(knotGroup, path.join(outDir, 'placeholder-abstract.glb'));
}

main().catch(console.error);
