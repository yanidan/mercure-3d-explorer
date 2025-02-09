import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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

    // Load Mercury texture
    const textureLoader = new THREE.TextureLoader();
    const mercuryTexture = textureLoader.load('/mercury-texture.jpg');

    // Create a more complex geometry for Mercury
    const mercuryGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create a material with the Mercury texture
    const material = new THREE.MeshStandardMaterial({
      map: mercuryTexture,
      metalness: 0.5,
      roughness: 0.7,
      bumpMap: mercuryTexture,
      bumpScale: 0.05,
    });

    // Create displacement patterns for the surface
    const displacementMap = new THREE.DataTexture(
      new Float32Array(64 * 64).map(() => Math.random() * 0.1),
      64,
      64,
      THREE.RedFormat,
      THREE.FloatType
    );
    displacementMap.needsUpdate = true;
    material.displacementMap = displacementMap;
    material.displacementScale = 0.2;

    // Create the Mercury mesh
    const mercury = new THREE.Mesh(mercuryGeometry, material);

    // Add some craters
    const craterGeometry = new THREE.CircleGeometry(0.2, 32);
    for (let i = 0; i < 15; i++) {
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.6,
        roughness: 0.4,
      });
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      
      // Position craters randomly on the surface
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = 2;
      
      crater.position.x = radius * Math.sin(theta) * Math.cos(phi);
      crater.position.y = radius * Math.sin(theta) * Math.sin(phi);
      crater.position.z = radius * Math.cos(theta);
      
      crater.lookAt(new THREE.Vector3(0, 0, 0));
      mercury.add(crater);
    }

    scene.add(mercury);
    setIsLoading(false);

    // Camera position
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      mercury.rotation.y += 0.002;
      renderer.render(scene, camera);
    };

    animate();

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
          <div className="text-2xl animate-pulse">Loading Mercury...</div>
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
