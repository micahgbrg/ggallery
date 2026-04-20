import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SculptureConfig } from '../config/schema';
import { Pedestal } from './Pedestal';

class SculptureErrorBoundary extends React.Component<
  { config: SculptureConfig; position: [number, number, number]; onSelect: (sculpture: SculptureConfig) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(`Failed to load sculpture model from ${this.props.config.file}:`, error);
  }

  render() {
    if (this.state.hasError) {
      // Render simple wireframe box placeholder on error
      const pedSize = 1.0;
      const pedHeight = 1.0;
      const boxSize = 0.8;
      
      return (
        <group position={this.props.position}>
          <Pedestal width={pedSize} depth={pedSize} height={pedHeight} />
          <mesh position={[0, pedHeight + boxSize / 2, 0]} castShadow onClick={(e) => { e.stopPropagation(); this.props.onSelect(this.props.config); }}>
            <boxGeometry args={[boxSize, boxSize, boxSize]} />
            <meshBasicMaterial color="#ff0000" wireframe />
          </mesh>
        </group>
      );
    }
    return this.props.children;
  }
}

interface SculptureModelProps {
  config: SculptureConfig;
  position: [number, number, number];
  onSelect: (sculpture: SculptureConfig) => void;
}

function SculptureModel({ config, position, onSelect }: SculptureModelProps) {
  const gltf = useGLTF(config.file);
  const [hovered, setHovered] = useState(false);

  // Clone scene so we don't modify shared materials across instances
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  const scale = config.scale || 1.0;
  const showPedestal = config.on_pedestal !== false; // default true

  // Calculate bounding box and dimensions
  const boundingBox = useMemo(() => {
    return new THREE.Box3().setFromObject(scene);
  }, [scene]);

  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  const scaledSizeX = size.x * scale;
  const scaledSizeZ = size.z * scale;
  const pedSize = Math.max(scaledSizeX, scaledSizeZ, 0.5) * 1.3; 
  const pedHeight = showPedestal ? 1.0 : 0;

  // Align bottom of model to the top of the pedestal (or floor when on_pedestal: false)
  const modelYOffset = pedHeight - (boundingBox.min.y * scale);

  // Apply subtle highlight (emissive boost) on hover
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        
        if (!mesh.userData.originalEmissive) {
            mesh.userData.originalEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
            mesh.userData.originalEmissiveIntensity = mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 1;
        }

        if (hovered) {
          mat.emissive = new THREE.Color(0x222222);
          mat.emissiveIntensity = 1;
        } else {
          mat.emissive = mesh.userData.originalEmissive;
          mat.emissiveIntensity = mesh.userData.originalEmissiveIntensity;
        }
      }
    });
  }, [hovered, scene]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto'; // cleanup on unmount
    };
  }, [hovered]);

  return (
    <group position={position}>
      {showPedestal && <Pedestal width={pedSize} depth={pedSize} height={pedHeight} />}
      <group position={[0, modelYOffset, 0]} scale={[scale, scale, scale]}>
        <primitive
          object={scene}
          onClick={(e: any) => {
            e.stopPropagation();
            onSelect(config);
          }}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation();
            setHovered(false);
          }}
        />
      </group>
    </group>
  );
}

export function Sculpture(props: SculptureModelProps) {
  // Pre-load the GLTF file quietly to avoid some suspense waterfall if needed,
  // but useGLTF handles caching internally anyway.
  return (
    <SculptureErrorBoundary config={props.config} position={props.position} onSelect={props.onSelect}>
      <Suspense fallback={
        <group position={props.position}>
          <Pedestal width={1.0} depth={1.0} height={1.0} />
          {/* Subtle placeholder while loading */}
          <mesh position={[0, 1.5, 0]} castShadow onClick={(e) => { e.stopPropagation(); props.onSelect(props.config); }}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color="#cccccc" wireframe />
          </mesh>
        </group>
      }>
        <SculptureModel {...props} />
      </Suspense>
    </SculptureErrorBoundary>
  );
}
