import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

async function run() {
  let gltfCore, gltfExt, gltfFunc, meshoptMod, sharp;
  try {
    gltfCore = await import('@gltf-transform/core');
    gltfExt = await import('@gltf-transform/extensions');
    gltfFunc = await import('@gltf-transform/functions');
    meshoptMod = await import('meshoptimizer');
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.error(e);
    console.error('\nMissing dependencies. Please run:\nnpm install --save-dev @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer sharp draco3dgltf\n');
    process.exit(1);
  }

  const { NodeIO } = gltfCore;
  const { ALL_EXTENSIONS } = gltfExt;
  const { dedup, prune, simplify, textureCompress, meshopt } = gltfFunc;
  const { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } = meshoptMod;

  let galleryConfig;
  try {
    const yamlPath = path.resolve('gallery/gallery.yaml');
    const content = await fs.readFile(yamlPath, 'utf8');
    galleryConfig = yaml.parse(content);
  } catch (e) {
    console.error('Failed to read gallery/gallery.yaml', e);
    process.exit(1);
  }

  const sculptures = galleryConfig.sculptures || [];
  if (sculptures.length === 0) {
    console.log('No sculptures found in gallery.yaml');
    return;
  }

  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.encoder': MeshoptEncoder,
      'meshopt.decoder': MeshoptDecoder,
    });

  const statsList = [];

  for (const sculpture of sculptures) {
    const filePath = sculpture.file;
    const inputPath = path.resolve('gallery', filePath);
    
    if (!existsSync(inputPath)) {
      console.warn(`File not found: ${inputPath}, skipping...`);
      continue;
    }

    try {
      const doc = await io.read(inputPath);
      const prevSize = (await fs.stat(inputPath)).size;
      
      let prevCount = 0;
      doc.getRoot().listMeshes().forEach((mesh: any) => {
        mesh.listPrimitives().forEach((prim: any) => {
          const indices = prim.getIndices();
          if (indices) {
            prevCount += indices.getCount() / 3;
          } else {
            const pos = prim.getAttribute('POSITION');
            if (pos) {
              prevCount += pos.getCount() / 3;
            }
          }
        });
      });

      console.log(`Processing: ${filePath}`);
      console.log(`Original: ${(prevSize / 1024 / 1024).toFixed(2)} MB, ${Math.round(prevCount)} triangles`);

      const transforms = [dedup(), prune()];
      if (prevCount > 100000) {
        transforms.push(simplify({ simplifier: MeshoptSimplifier, ratio: 0.5 }));
      }
      transforms.push(textureCompress({ encoder: sharp, targetFormat: 'webp' }));
      transforms.push(meshopt({ encoder: MeshoptEncoder }));

      await doc.transform(...transforms);

      const outputPath = path.resolve('.cache/optimized/gallery', filePath);
      const outDir = path.dirname(outputPath);
      if (!existsSync(outDir)) {
        await fs.mkdir(outDir, { recursive: true });
      }

      const outputBuffer = await io.writeBinary(doc);
      await fs.writeFile(outputPath, outputBuffer);

      let postCount = 0;
      doc.getRoot().listMeshes().forEach((mesh: any) => {
        mesh.listPrimitives().forEach((prim: any) => {
          const indices = prim.getIndices();
          if (indices) {
            postCount += indices.getCount() / 3;
          } else {
            const pos = prim.getAttribute('POSITION');
            if (pos) {
              postCount += pos.getCount() / 3;
            }
          }
        });
      });

      const postSize = outputBuffer.byteLength;
      console.log(`Optimized: ${(postSize / 1024 / 1024).toFixed(2)} MB, ${Math.round(postCount)} triangles`);
      
      const reduction = Math.round((1 - postSize / prevSize) * 100);
      console.log(`Reduction: ${reduction}%\n`);

      statsList.push({
        file: filePath,
        origMB: (prevSize / 1024 / 1024).toFixed(2),
        origTris: Math.round(prevCount),
        newMB: (postSize / 1024 / 1024).toFixed(2),
        newTris: Math.round(postCount),
        reduction: `${reduction}%`
      });

    } catch (e) {
      console.error(`Optimization failed for ${filePath}:`, e);
    }
  }

  if (statsList.length > 0) {
    console.table(statsList);
  } else {
    console.log('No files were optimized.');
  }
}

run();
