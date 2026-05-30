import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleDust() {
  const ref = useRef();
  
  // Generate random points in a sphere shape
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 22; // radius
      
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.02;
      ref.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.065}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.35}
        />
      </Points>
    </group>
  );
}

function NeuralLines() {
  const lineRef = useRef();
  const nodeCount = 28;

  // Static nodes positions & velocity vectors
  const { nodes, linesGeometry } = useMemo(() => {
    const tempNodes = [];
    for (let i = 0; i < nodeCount; i++) {
      tempNodes.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 35,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.04
        )
      });
    }

    const geometry = new THREE.BufferGeometry();
    return { nodes: tempNodes, linesGeometry: geometry };
  }, []);

  useFrame(() => {
    const linePositions = [];
    const maxDist = 7.5;

    // Update positions
    nodes.forEach(node => {
      node.pos.add(node.vel);

      // Bounce off walls boundaries
      if (Math.abs(node.pos.x) > 18) node.vel.x *= -1;
      if (Math.abs(node.pos.y) > 10) node.vel.y *= -1;
      if (Math.abs(node.pos.z) > 10) node.vel.z *= -1;
    });

    // Check connections
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodes[i].pos.distanceTo(nodes[j].pos);
        if (dist < maxDist) {
          linePositions.push(nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
          linePositions.push(nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
        }
      }
    }

    if (lineRef.current) {
      lineRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.06}
        linewidth={1}
      />
    </lineSegments>
  );
}

export default function Canvas3D() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: '#050505'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#888888" />
        <ParticleDust />
        <NeuralLines />
      </Canvas>
    </div>
  );
}
