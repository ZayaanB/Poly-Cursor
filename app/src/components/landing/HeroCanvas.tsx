"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface HeroCanvasProps {
  scrollProgress: number;
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  const group = useRef<THREE.Group>(null);
  const cursor = useRef<THREE.Mesh>(null);
  const solid = useRef<THREE.Mesh>(null);
  const scrollRef = useRef(scrollProgress);
  scrollRef.current = scrollProgress;

  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#141414"),
        metalness: 0.92,
        roughness: 0.28,
      }),
    []
  );

  const chromeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#1c1c1c"),
        metalness: 1,
        roughness: 0.22,
        clearcoat: 0.35,
        clearcoatRoughness: 0.45,
      }),
    []
  );

  const strikeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#14F195"),
        emissive: new THREE.Color("#14F195"),
        emissiveIntensity: 0.12,
        metalness: 0.35,
        roughness: 0.55,
      }),
    []
  );

  useFrame((_, delta) => {
    const g = group.current;
    const c = cursor.current;
    const s = solid.current;
    if (!g || !c || !s) return;

    const p = THREE.MathUtils.clamp(scrollRef.current, 0, 1);
    const twist = p * Math.PI * 2.15;
    const lean = p * 0.85;

    g.rotation.y = twist;
    g.rotation.x = lean * 0.35;
    g.rotation.z = Math.sin(twist * 0.5) * 0.12;

    c.rotation.y += delta * 0.15;
    s.rotation.x += delta * 0.08;
  });

  return (
    <group ref={group} position={[0, -0.05, 0]}>
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.35}
        color="#f5f5f5"
      />
      <directionalLight
        position={[-5, -2, -6]}
        intensity={0.35}
        color="#2a2a2a"
      />

      <mesh ref={cursor} position={[0.15, 0.1, 0]} material={chromeMat}>
        <boxGeometry args={[0.14, 1.35, 0.42]} />
        <Edges color="#F5F5F5" threshold={15} />
      </mesh>

      <mesh position={[0.22, -0.05, 0.12]} material={strikeMat}>
        <boxGeometry args={[0.04, 0.85, 0.28]} />
      </mesh>

      <mesh ref={solid} position={[-0.2, -0.05, -0.05]} material={accentMat}>
        <octahedronGeometry args={[0.72, 0]} />
        <Edges color="#F5F5F5" threshold={20} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color="#121212"
          metalness={0.2}
          roughness={0.95}
        />
      </mesh>
    </group>
  );
}

export function HeroCanvas({ scrollProgress }: HeroCanvasProps) {
  return (
    <div className="h-full w-full bg-[#121212]">
      <Canvas
        camera={{ position: [0, 0.35, 4.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#121212"]} />
        <fog attach="fog" args={["#121212", 4.5, 11]} />
        <Scene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
