
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MercuryScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create grid texture
      const gridSize = 512;
      const textureLoader = new THREE.TextureLoader();
      const photoTexture = textureLoader.load('/moon_baseColor.jpeg');

      // Mercury geometry with a material that includes grid texture
      const geometry = new THREE.SphereGeometry(2, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        color: 0x8B8B8B,
        metalness: 0.7,
        roughness: 0.5,
        map: photoTexture,
        bumpScale: 0.02,
      });

    const mercury = new THREE.Mesh(geometry, material);
    scene.add(mercury);
    setIsLoading(false);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const starsPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starsPositions[i] = (Math.random() - 0.5) * 100;
      starsPositions[i + 1] = (Math.random() - 0.5) * 100;
      starsPositions[i + 2] = (Math.random() - 0.5) * 100;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Camera position
    camera.position.z = 5;

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = {
      x: 0,
      y: 0
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      mercury.rotation.y += deltaMove.x * 0.005;
      mercury.rotation.x += deltaMove.y * 0.005;

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Only auto-rotate when not being dragged
      if (!isDragging) {
        mercury.rotation.y += 0.002;
      }

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
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Helper function to create grid texture
  const createGridTexture = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Fill background
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(0, 0, size, size);

    // Draw grid
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;

    const cellSize = size / 20; // 20 grid divisions

    for (let i = 0; i <= size; i += cellSize) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    return canvas;
  };

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
