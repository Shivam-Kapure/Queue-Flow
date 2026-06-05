import React, { useRef, useState, useMemo, useEffect } from 'react';
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

function QueueNode({ index, total, isExiting, exitType, onClick, activeId, id }) {
  const meshRef = useRef();
  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  // Calculate Target position based on queue order (FIFO)
  const targetX = useMemo(() => {
    if (isExiting) {
      return exitType === 'served' ? 6.5 : -5.5; // served goes right, left goes left/out
    }
    if (total <= 1) return 0;
    const startX = -4.2;
    const endX = 4.0;
    const pct = 1 - (index / (Math.max(total - 1, 1)));
    return startX + pct * (endX - startX);
  }, [index, total, isExiting, exitType]);

  const targetY = useMemo(() => {
    if (isExiting && exitType === 'left') {
      return -2.0; // drops down
    }
    return 0;
  }, [isExiting, exitType]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smoothly lerp towards target position
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 4 * delta);
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY + (isExiting ? 0 : Math.sin(state.clock.getElapsedTime() * 2 + index) * 0.12),
        4 * delta
      );
      
      // Floating / rotation
      meshRef.current.rotation.y += delta * 0.6;

      if (isExiting) {
        // Fade out
        setOpacity(prev => Math.max(0, prev - delta * 1.0));
        setScale(prev => Math.max(0, prev - delta * 1.0));
      }
    }
  });

  const isSelected = activeId === id;

  return (
    <mesh
      ref={meshRef}
      position={[targetX - 1.5, 0, 0]} // spawn slightly behind its target
      scale={[scale, scale, scale]}
      onClick={(e) => {
        if (isExiting) return;
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
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

export default function QueuePipeline({ members = null, queueLength = 6 }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState([]);

  // Keep track of previous members to detect changes
  const prevMembersRef = useRef([]);

  useEffect(() => {
    // If no real members (e.g. landing page), generate static mock nodes
    if (!members) {
      const arr = [];
      for (let i = 0; i < queueLength; i++) {
        arr.push({
          id: `node-${i}`,
          posIndex: i,
          name: `Node-Flow#${2000 + i}`,
          lat: `${(Math.random() * 80 + 30).toFixed(1)}ms`,
          isExiting: false,
          exitType: null
        });
      }
      setNodes(arr);
      return;
    }

    // If real members are provided:
    setNodes(currentNodes => {
      // Map members to their active representations
      const updatedNodes = [...currentNodes];

      // Remove any nodes that finished exiting
      const activeOrAnimatingNodes = updatedNodes.filter(node => {
        if (node.isExiting) {
          return true; // Keep animating until setTimeout removes it
        }
        return members.some(m => m.id === node.id);
      });

      // Update positions of existing nodes that are still waiting
      const refreshedNodes = activeOrAnimatingNodes.map(node => {
        if (node.isExiting) return node;
        
        const memberIndex = members.findIndex(m => m.id === node.id);
        const member = members[memberIndex];
        return {
          ...node,
          posIndex: memberIndex,
          name: member.user?.name || `User-${member.userId.substring(0, 4)}`,
          lat: member.isVip ? 'VIP Bypass' : `Pos: #${member.position}`
        };
      });

      // Find users who were in previous members but are NOT in current members (exited)
      const prevMembers = prevMembersRef.current;
      prevMembers.forEach((prevMember, prevIndex) => {
        const stillExists = members.some(m => m.id === prevMember.id);
        if (!stillExists) {
          const existingNodeIndex = refreshedNodes.findIndex(n => n.id === prevMember.id);
          if (existingNodeIndex !== -1 && !refreshedNodes[existingNodeIndex].isExiting) {
            // Determine exit type: if they were at index 0, they were served (gateway access). Otherwise, they left.
            const exitType = prevIndex === 0 ? 'served' : 'left';
            refreshedNodes[existingNodeIndex] = {
              ...refreshedNodes[existingNodeIndex],
              isExiting: true,
              exitType
            };

            // Remove node after animation completes (1.2 seconds)
            setTimeout(() => {
              setNodes(curr => curr.filter(n => n.id !== prevMember.id));
            }, 1200);
          }
        }
      });

      // Add new users who joined
      members.forEach((member, i) => {
        const alreadyRepresented = refreshedNodes.some(n => n.id === member.id);
        if (!alreadyRepresented) {
          refreshedNodes.push({
            id: member.id,
            posIndex: i,
            name: member.user?.name || `User-${member.userId.substring(0, 4)}`,
            lat: member.isVip ? 'VIP Bypass' : `Pos: #${member.position}`,
            isExiting: false,
            exitType: null
          });
        }
      });

      // Sort waiting nodes by posIndex so wait order is clean
      refreshedNodes.sort((a, b) => {
        if (a.isExiting && !b.isExiting) return -1;
        if (!a.isExiting && b.isExiting) return 1;
        return a.posIndex - b.posIndex;
      });

      return refreshedNodes;
    });

    prevMembersRef.current = members;
  }, [members, queueLength]);

  const handleNodeClick = (id, posX) => {
    const node = nodes.find(n => n.id === id);
    if (node && !node.isExiting) {
      setSelectedNode(node);
      setPanelPos({ x: posX, y: 0.8 });
    }
  };

  const activeNodesCount = useMemo(() => {
    return nodes.filter(n => !n.isExiting).length;
  }, [nodes]);

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
          <span>Load: {activeNodesCount} Active Users</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[0, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[5.2, 0, 0]} intensity={1.5} color="#ffffff" />
        
        <PipelineTube />
        <GatewayPortal />
        
        {nodes.map((node) => (
          <QueueNode
            key={node.id}
            id={node.id}
            index={node.isExiting ? 0 : node.posIndex}
            total={activeNodesCount}
            isExiting={node.isExiting}
            exitType={node.exitType}
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
                  <span>Info:</span>
                  <span className="text-white font-mono">{selectedNode.lat}</span>
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
