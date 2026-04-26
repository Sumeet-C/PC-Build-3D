// ─── 3D Build Scene ─────────────────────────────────────────────────────────
// Uses React Three Fiber + Drei to render PC components as transparent
// procedural geometry. Supports exploded and merged views.

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Text,
  Environment,
  ContactShadows,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';

// ─── Color Map ──────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  CPU: '#6366f1',
  GPU: '#ec4899',
  RAM: '#10b981',
  Motherboard: '#f59e0b',
  Storage: '#06b6d4',
  PSU: '#ef4444',
  Case: '#8b5cf6',
  Cooling: '#14b8a6',
};

// ─── Exploded positions (spread apart for viewing) ──────────────────────────
const EXPLODED_POSITIONS = {
  Case: [0, 0, 0],
  Motherboard: [0, 0.3, 0],
  CPU: [0, 0.8, 0.3],
  RAM: [0.8, 0.8, 0.3],
  GPU: [0, -0.3, 0.8],
  Storage: [-1.2, -0.3, 0],
  PSU: [0, -1.2, 0],
  Cooling: [0, 1.5, 0.3],
};

// ─── Merged positions (assembled inside case) ──────────────────────────────
const MERGED_POSITIONS = {
  Case: [0, 0, 0],
  Motherboard: [0, 0.05, 0.05],
  CPU: [0, 0.15, 0.2],
  RAM: [0.35, 0.15, 0.2],
  GPU: [0, -0.2, 0.4],
  Storage: [-0.45, -0.35, 0.1],
  PSU: [0, -0.65, 0],
  Cooling: [0, 0.45, 0.2],
};

// ─── Lerp helper for smooth animation ───────────────────────────────────────
function lerpV3(current, target, alpha) {
  return [
    current[0] + (target[0] - current[0]) * alpha,
    current[1] + (target[1] - current[1]) * alpha,
    current[2] + (target[2] - current[2]) * alpha,
  ];
}

// ─── Individual Component Models ────────────────────────────────────────────

function CPUModel({ color, highlighted, onClick }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current && highlighted) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <group onClick={onClick}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.35, 0.06, 0.35]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.7 : 0.4}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Pins underneath */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.3]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
    </group>
  );
}

function GPUModel({ color, highlighted, onClick }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current && highlighted) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <group onClick={onClick}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.7, 0.12, 0.3]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.7 : 0.4}
          roughness={0.1}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Fan circles */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.01, 8, 24]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function RAMModel({ color, highlighted, onClick }) {
  return (
    <group onClick={onClick}>
      {[0, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.04, 0.35, 0.02]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={highlighted ? 0.7 : 0.4}
            roughness={0.1}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function MotherboardModel({ color, highlighted, onClick }) {
  return (
    <group onClick={onClick}>
      <mesh>
        <boxGeometry args={[0.9, 0.03, 0.75]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.6 : 0.3}
          roughness={0.2}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* PCB traces */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.85, 0.005, 0.7]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
      {/* CPU socket area */}
      <mesh position={[0, 0.025, 0.1]}>
        <boxGeometry args={[0.2, 0.01, 0.2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

function StorageModel({ color, highlighted, onClick }) {
  return (
    <group onClick={onClick}>
      <mesh>
        <boxGeometry args={[0.25, 0.03, 0.18]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.7 : 0.4}
          roughness={0.1}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function PSUModel({ color, highlighted, onClick }) {
  return (
    <group onClick={onClick}>
      <mesh>
        <boxGeometry args={[0.5, 0.25, 0.35]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.6 : 0.3}
          roughness={0.3}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Vent grill */}
      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[0.45, 0.2, 0.005]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
    </group>
  );
}

function CaseModel({ color, highlighted, onClick }) {
  return (
    <group onClick={onClick}>
      {/* Main shell - wireframe box */}
      <mesh>
        <boxGeometry args={[1.2, 1.6, 0.9]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.15 : 0.08}
          roughness={0.1}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wireframe edges */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(1.2, 1.6, 0.9)]}
        />
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}

function CoolingModel({ color, highlighted, onClick }) {
  const fanRef = useRef();
  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * 3;
    }
  });
  return (
    <group onClick={onClick}>
      {/* Fan housing */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.06, 24]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlighted ? 0.5 : 0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Spinning blades */}
      <group ref={fanRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            rotation={[Math.PI / 2, 0, (Math.PI * 2 * i) / 6]}
            position={[
              Math.cos((Math.PI * 2 * i) / 6) * 0.07,
              0,
              Math.sin((Math.PI * 2 * i) / 6) * 0.07,
            ]}
          >
            <boxGeometry args={[0.12, 0.01, 0.025]} />
            <meshPhysicalMaterial
              color={color}
              transparent
              opacity={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Component Renderer ─────────────────────────────────────────────────────
const MODEL_MAP = {
  CPU: CPUModel,
  GPU: GPUModel,
  RAM: RAMModel,
  Motherboard: MotherboardModel,
  Storage: StorageModel,
  PSU: PSUModel,
  Case: CaseModel,
  Cooling: CoolingModel,
};

function PCComponent({ type, merged, highlighted, onSelect }) {
  const groupRef = useRef();
  const [currentPos, setCurrentPos] = useState(
    EXPLODED_POSITIONS[type] || [0, 0, 0],
  );

  const targetPos = merged
    ? MERGED_POSITIONS[type] || [0, 0, 0]
    : EXPLODED_POSITIONS[type] || [0, 0, 0];

  useFrame(() => {
    const newPos = lerpV3(currentPos, targetPos, 0.04);
    setCurrentPos(newPos);
    if (groupRef.current) {
      groupRef.current.position.set(...newPos);
    }
  });

  const ModelComp = MODEL_MAP[type];
  if (!ModelComp) return null;

  const color = TYPE_COLORS[type] || '#888888';

  return (
    <group ref={groupRef}>
      <ModelComp
        color={color}
        highlighted={highlighted}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(type);
        }}
      />
      {/* Label */}
      {!merged && (
        <Text
          position={[0, type === 'Case' ? 1 : 0.35, 0]}
          fontSize={0.08}
          color={color}
          anchorX="center"
          anchorY="bottom"
          font={undefined}
        >
          {type}
        </Text>
      )}
    </group>
  );
}

// ─── Grid Floor ─────────────────────────────────────────────────────────────
function GridFloor() {
  return (
    <group>
      <gridHelper
        args={[10, 20, '#1e293b', '#1e293b']}
        position={[0, -2, 0]}
      />
      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.3}
        scale={10}
        blur={2}
        far={4}
      />
    </group>
  );
}

// ─── Main Scene Component ───────────────────────────────────────────────────
export default function BuildScene({ build, merged, highlightedType, onSelectType }) {
  // Figure out which component types are present in the build
  const activeTypes = useMemo(() => {
    if (!build) return [];
    return Object.keys(build).filter((key) => build[key] != null);
  }, [build]);

  const hasComponents = activeTypes.length > 0;

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [2.5, 2, 3], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} color="#6366f1" />
        <pointLight position={[0, 3, 0]} intensity={0.4} color="#8b5cf6" />

        {/* Environment */}
        <Environment preset="night" />

        {/* Grid */}
        <GridFloor />

        {/* Components */}
        {hasComponents ? (
          activeTypes.map((type) => (
            <PCComponent
              key={type}
              type={type}
              merged={merged}
              highlighted={highlightedType === type}
              onSelect={onSelectType}
            />
          ))
        ) : (
          <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
            <mesh>
              <icosahedronGeometry args={[0.5, 1]} />
              <meshPhysicalMaterial
                color="#6366f1"
                transparent
                opacity={0.15}
                wireframe
              />
            </mesh>
            <Text
              position={[0, -0.8, 0]}
              fontSize={0.12}
              color="#64748b"
              anchorX="center"
            >
              Select components to visualize
            </Text>
          </Float>
        )}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={8}
          autoRotate={!hasComponents}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
