
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MercuryScene = () => {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState({
    diameter: '4,879 km',
    orbitalPeriod: '88 days',
    temperature: '-180°C to 430°C',
    distance: '57.9M km'
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Camera position
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="mercury-scene" ref={containerRef}>
      {isLoading && (
        <div className="loading-screen">
          <div className="text-2xl animate-pulse">Loading Scene...</div>
        </div>
      )}
      <div className="mercury-overlay">
        <h1 className="mercury-title">Mercury</h1>
        <p className="text-muted-foreground mt-2">
          The smallest and innermost planet of the Solar System
        </p>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Diameter</div>
          <div className="text-lg font-semibold">{stats.diameter}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Orbital Period</div>
          <div className="text-lg font-semibold">{stats.orbitalPeriod}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Temperature Range</div>
          <div className="text-lg font-semibold">{stats.temperature}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Distance from Sun</div>
          <div className="text-lg font-semibold">{stats.distance}</div>
        </div>
      </div>
    </div>
  );
};
