import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function GatewayPortal() {
  const portalRef = useRef();

  useFrame(({ clock }) => {
    if (portalRef.current) {
      portalRef.current.rotation.z = clock.getElapsedTime() * 0.5;
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.05;
      portalRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[5.2, 0, 0]}>
      {/* Torus Gateway Portal */}
      <mesh ref={portalRef}>
        <torusGeometry args={[0.9, 0.08, 16, 100]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>
      {/* Glow aura */}
      <mesh>
        <cylinderGeometry args={[0.85, 0.85, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PipelineTube() {
  return (
    <group>
      {/* Outer transparent protective pipeline tube */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 10, 32, 1, true]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.03}
          roughness={0.1}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner guiding wireframe rail */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.68, 0.68, 10, 8, 20, true]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.045} />
      </mesh>
    </group>
  );
}

function QueueNode({ index, total, isServing, onClick, activeId, id }) {
  const meshRef = useRef();
  
  // Calculate Target position based on queue order (FIFO)
  // Front of queue is index 0 -> placed near the Gateway Portal (X = 4)
  // End of queue is index total-1 -> placed near pipeline entrance (X = -4.5)
  const targetX = useMemo(() => {
    if (total <= 1) return 0;
    const startX = -4.2;
    const endX = 4.0;
    // Distribute nodes along the X axis
    const pct = 1 - (index / (Math.max(total - 1, 1)));
    return startX + pct * (endX - startX);
  }, [index, total]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly lerp towards target position
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 5 * delta);
      // Floating animation in Y axis
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2 + index) * 0.12;
      // Rotation
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  const isSelected = activeId === id;

  return (
    <mesh
      ref={meshRef}
      position={[targetX - 2, 0, 0]} // start slightly behind target on spawn
      onClick={(e) => {
        e.stopPropagation();
        onClick(id, targetX);
      }}
    >
      <sphereGeometry args={[0.34, 32, 32]} />
      <meshStandardMaterial
        color={isSelected ? '#ffffff' : '#4a4a4a'}
        emissive={isSelected ? '#ffffff' : '#111111'}
        emissiveIntensity={isSelected ? 0.6 : 0.15}
        roughness={0.08}
        metalness={0.95}
      />
    </mesh>
  );
}

export default function QueuePipeline({ queueLength = 6 }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });

  // Generate node representations
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < queueLength; i++) {
      arr.push({
        id: `node-${i}-${Math.floor(Math.random() * 1000)}`,
        posIndex: i,
        name: `Node-Flow#${2000 + i}`,
        lat: `${(Math.random() * 80 + 30).toFixed(1)}ms`
      });
    }
    return arr;
  }, [queueLength]);

  const handleNodeClick = (id, posX) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      setSelectedNode(node);
      setPanelPos({ x: posX, y: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[480px] bg-secondary/30 border border-border rounded-lg overflow-hidden glass-panel">
      <div className="absolute top-6 left-6 z-10">
        <p className="text-[10px] uppercase tracking-wider text-muted mb-1">System Visualization</p>
        <h3 className="text-xl font-medium tracking-tight text-white">Live Pipeline Scheduler</h3>
      </div>
      
      <div className="absolute top-6 right-6 z-10 flex gap-4 text-[10px] tracking-wider text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow"></span>
          <span>Gateway Active</span>
        </div>
        <div>
          <span>Load: {queueLength} Active Users</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[5.2, 0, 0]} intensity={1.5} color="#ffffff" />
        
        <PipelineTube />
        <GatewayPortal />
        
        {nodes.map((node, index) => (
          <QueueNode
            key={node.id}
            id={node.id}
            index={index}
            total={nodes.length}
            activeId={selectedNode?.id}
            onClick={handleNodeClick}
          />
        ))}

        {selectedNode && (
          <Html position={[panelPos.x, panelPos.y, 0]} center>
            <div className="bg-black/95 border border-white/20 p-3 rounded text-[10px] w-40 backdrop-blur-md text-white select-none">
              <div className="flex justify-between border-b border-white/10 pb-1.5 mb-1.5 font-bold">
                <span>{selectedNode.name}</span>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="text-muted hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-0.5 text-muted">
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="text-white font-mono font-medium">#{selectedNode.posIndex + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-white font-mono">{selectedNode.lat}</span>
                </div>
                <div className="flex justify-between">
                  <span>Priority:</span>
                  <span className="text-white font-mono">{selectedNode.posIndex === 0 ? 'Urgent' : 'Standard'}</span>
                </div>
              </div>
            </div>
          </Html>
        )}

        <OrbitControls 
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 + 0.15} 
          minPolarAngle={Math.PI / 2 - 0.15}
          maxAzimuthAngle={0.15}
          minAzimuthAngle={-0.15}
        />
      </Canvas>
    </div>
  );
}
