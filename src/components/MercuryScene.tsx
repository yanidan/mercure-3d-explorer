import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MercuryScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomedOnMars, setIsZoomedOnMars] = useState(false);
  const [showHabitableZones, setShowHabitableZones] = useState(false);
  const [stats, setStats] = useState({
    diameter: '4,879 km',
    orbitalPeriod: '88 days',
    temperature: '-180°C to 430°C',
    distance: '57.9M km'
  });
  
  const marsStats = {
    diameter: '6,792 km',
    orbitalPeriod: '687 days',
    temperature: '-140°C to 20°C',
    distance: '227.9M km'
  };

  const mercuryStats = {
    diameter: '4,879 km',
    orbitalPeriod: '88 days',
    temperature: '-180°C to 430°C',
    distance: '57.9M km'
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load('/moon_baseColor.jpeg', (texture) => {
      if (showHabitableZones) {
        analyzeHabitableZones(texture, mercury);
      }
    });

    const analyzeHabitableZones = (texture: THREE.Texture, planet: THREE.Mesh) => {
      const image = texture.image;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const gridSize = 100;
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;
      const habitableThreshold = 8;

      const geometry = planet.geometry as THREE.SphereGeometry;
      const positions = geometry.attributes.position;
      const colors = new Float32Array(positions.count * 3);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = Math.floor(j * cellWidth);
          const y = Math.floor(i * cellHeight);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const neighbors = [
            ctx.getImageData(x + cellWidth, y, 1, 1).data,
            ctx.getImageData(x - cellWidth, y, 1, 1).data,
            ctx.getImageData(x, y + cellHeight, 1, 1).data,
            ctx.getImageData(x, y - cellHeight, 1, 1).data,
            ctx.getImageData(x + cellWidth, y + cellHeight, 1, 1).data,
            ctx.getImageData(x - cellWidth, y - cellHeight, 1, 1).data,
            ctx.getImageData(x + cellWidth, y - cellHeight, 1, 1).data,
            ctx.getImageData(x - cellWidth, y + cellHeight, 1, 1).data,
          ];

          let isHabitable = true;
          for (const neighbor of neighbors) {
            const diff = Math.abs(pixel[0] - neighbor[0]) +
                        Math.abs(pixel[1] - neighbor[1]) +
                        Math.abs(pixel[2] - neighbor[2]);
            if (diff > habitableThreshold) {
              isHabitable = false;
              break;
            }
          }

          const startIndex = (i * gridSize + j) * (positions.count / (gridSize * gridSize)) * 3;
          const color = isHabitable ? new THREE.Color(0x00ff00).multiplyScalar(2.5) : new THREE.Color(0x080808);
          
          for (let k = 0; k < positions.count / (gridSize * gridSize); k++) {
            colors[startIndex + k * 3] = color.r;
            colors[startIndex + k * 3 + 1] = color.g;
            colors[startIndex + k * 3 + 2] = color.b;
          }
        }
      }

      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = planet.material as THREE.MeshStandardMaterial;
      material.vertexColors = true;
      material.needsUpdate = true;
    };

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B8B8B,
      metalness: 0.7,
      roughness: 0.5,
      map: photoTexture,
      bumpScale: 0.02,
      vertexColors: showHabitableZones,
    });

    const mercury = new THREE.Mesh(geometry, material);
    scene.add(mercury);

    const textureLoaderMars = new THREE.TextureLoader();
    const photoTextureMars = textureLoaderMars.load('/mars_topologie.jpg');
    const marsGeometry = new THREE.SphereGeometry(2.4, 64, 64);
    const marsMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 0.7,
      map: photoTextureMars,
    });
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    mars.position.set(8, 4, -10);
    scene.add(mars);

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

    camera.position.z = 5;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let previousMousePosition = {
      x: 0,
      y: 0
    };

    const handleMouseDown = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(mars);

      if (intersects.length > 0) {
        setIsZoomedOnMars(true);
        setStats(marsStats);
      } else {
        const mercuryIntersects = raycaster.intersectObject(mercury);
        if (mercuryIntersects.length > 0) {
          setIsZoomedOnMars(false);
          setStats(mercuryStats);
        }
        isDragging = true;
        previousMousePosition = {
          x: event.clientX,
          y: event.clientY
        };
      }
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
      if (isDragging) {
        setIsZoomedOnMars(false);
        setStats(mercuryStats);
      }
      isDragging = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);

      if (!isDragging) {
        mercury.rotation.y += 0.002;
        mars.rotation.y += 0.003;
      }

      if (isZoomedOnMars) {
        const targetPosition = new THREE.Vector3(15, 6, -12);
        camera.position.lerp(targetPosition, 0.05);
        camera.lookAt(new THREE.Vector3(8, 4, -10));
      } else {
        const defaultPosition = new THREE.Vector3(0, 0, 5);
        camera.position.lerp(defaultPosition, 0.05);
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsLoading(false);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isZoomedOnMars, showHabitableZones]);

  return (
    <div className="mercury-scene" ref={containerRef}>
      {isLoading && (
        <div className="loading-screen">
          <div className="text-2xl animate-pulse">Géneration de la scène...</div>
        </div>
      )}
      <div className="mercury-overlay">
        <h1 className="mercury-title">{isZoomedOnMars ? "Mars" : "Mercure"}</h1>
        <p className="text-muted-foreground mt-2">
          {isZoomedOnMars 
            ? "La planète rouge, quatrième planète du système solaire"
            : "La planète la plus petite et la plus proche du Soleil"}
        </p>
      </div>
      <button
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white text-black px-4 py-2 rounded-md shadow-lg hover:bg-gray-100 transition-colors"
        onClick={() => setShowHabitableZones(!showHabitableZones)}
      >
        {showHabitableZones ? 'Cacher zones habitables' : 'Montrer zones habitables'}
      </button>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Diamètre</div>
          <div className="text-lg font-semibold">{stats.diameter}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Période Orbitale</div>
          <div className="text-lg font-semibold">{stats.orbitalPeriod}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Intervale de Température</div>
          <div className="text-lg font-semibold">{stats.temperature}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-muted-foreground">Distance du Soleil</div>
          <div className="text-lg font-semibold">{stats.distance}</div>
        </div>
      </div>
    </div>
  );
};
