
import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';

function MercuryModel() {
  const { scene } = useGLTF("/mercure/scene.gltf");
  return <primitive object={scene} />;
}

export const MercuryScene = () => {
  const [isLoading] = useState(true);
  const [stats] = useState({
    diameter: '4,879 km',
    orbitalPeriod: '88 days',
    temperature: '-180°C to 430°C',
    distance: '57.9M km'
  });

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight intensity={2} position={[5, 3, 5]} />
        <Suspense fallback={<Html center>Loading Model...</Html>}>
          <MercuryModel />
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            screenSpacePanning={false}
            minDistance={3}
            maxDistance={10}
          />
        </Suspense>
      </Canvas>
      
      <div className="mercury-overlay" style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
        <h1 className="mercury-title text-4xl font-bold">Mercury</h1>
        <p className="text-muted-foreground mt-2">
          The smallest and innermost planet of the Solar System
        </p>
      </div>
      
      <div className="stats-grid" style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, auto)',
        gap: '1rem',
        background: 'rgba(0,0,0,0.7)',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Diameter</div>
          <div className="text-lg font-semibold text-white">{stats.diameter}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Orbital Period</div>
          <div className="text-lg font-semibold text-white">{stats.orbitalPeriod}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Temperature Range</div>
          <div className="text-lg font-semibold text-white">{stats.temperature}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Distance from Sun</div>
          <div className="text-lg font-semibold text-white">{stats.distance}</div>
        </div>
      </div>
    </div>
  );
};
