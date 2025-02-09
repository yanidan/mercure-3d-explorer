import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const MercuryScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomedOnMars, setIsZoomedOnMars] = useState(false);
  const [showHabitableZones, setShowHabitableZones] = useState(false);
  const [isTopographicView, setIsTopographicView] = useState(true);
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
    const topographicTexture = textureLoader.load('/moon_baseColor.jpeg');
    const topographicTextureMars = textureLoader.load('/mars_topologie.jpg');
    const standardTexture = textureLoader.load('/mercure_map.png');
    const standardTextureMars = textureLoader.load('/mars_map.png');
    
    const analyzeHabitableZones = (texture: THREE.Texture, planet: THREE.Mesh) => {
      if (!texture.image || !texture.image.complete) {
        console.log("Image not yet loaded");
        return;
      }

      const image = texture.image;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const chunkSize = 10;
      const threshold = 3;
      const width = canvas.width;
      const height = canvas.height;

      const geometry = planet.geometry as THREE.SphereGeometry;
      const positions = geometry.attributes.position;
      const colors = new Float32Array(positions.count * 3);

      for (let vertexIndex = 0; vertexIndex < positions.count; vertexIndex++) {
        const uv = new THREE.Vector2();
        const uvAttribute = geometry.getAttribute('uv');
        uv.fromBufferAttribute(uvAttribute, vertexIndex);

        const x = Math.floor(uv.x * width);
        const y = Math.floor(uv.y * height);

        const colors2D: number[][] = [];
        for (let dy = 0; dy < chunkSize; dy++) {
          for (let dx = 0; dx < chunkSize; dx++) {
            if (x + dx < width && y + dy < height) {
              const pixelData = ctx.getImageData(x + dx, y + dy, 1, 1).data;
              colors2D.push([pixelData[0], pixelData[1], pixelData[2]]);
            }
          }
        }

        const minColor = colors2D.reduce((min, c) => c.map((v, i) => Math.min(v, min[i])), [255, 255, 255]);
        const maxColor = colors2D.reduce((max, c) => c.map((v, i) => Math.max(v, max[i])), [0, 0, 0]);
        const colorDiff = maxColor.map((v, i) => v - minColor[i]);
        const maxDiff = Math.max(...colorDiff);

        let vertexColor;
        if (maxDiff < threshold) {
          vertexColor = new THREE.Color(0x00ff00).multiplyScalar(2.5);
        } else {
          vertexColor = new THREE.Color('#ea384c');
        }

        colors[vertexIndex * 3] = vertexColor.r;
        colors[vertexIndex * 3 + 1] = vertexColor.g;
        colors[vertexIndex * 3 + 2] = vertexColor.b;
      }

      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = planet.material as THREE.MeshStandardMaterial;
      material.vertexColors = true;
      material.needsUpdate = true;
    };

    const photoTexture = textureLoader.load('/moon_baseColor.jpeg', () => {
      if (showHabitableZones && !isZoomedOnMars) {
        setTimeout(() => {
          analyzeHabitableZones(photoTexture, mercury);
        }, 100);
      }
    });

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B8B8B,
      metalness: 0.7,
      roughness: 0.5,
      map: isTopographicView ? topographicTexture : standardTexture,
      bumpScale: 0.02,
      vertexColors: showHabitableZones,
    });

    const mercury = new THREE.Mesh(geometry, material);
    scene.add(mercury);

    if (showHabitableZones && !isZoomedOnMars) {
      analyzeHabitableZones(isTopographicView ? topographicTexture : standardTexture, mercury);
    }

    const marsGeometry = new THREE.SphereGeometry(2.4, 64, 64);
    const marsMaterial = new THREE.MeshStandardMaterial({
      metalness: 0.5,
      roughness: 0.7,
      map: isTopographicView ? topographicTextureMars : standardTextureMars,
      vertexColors: showHabitableZones,
    });
    const mars = new THREE.Mesh(marsGeometry, marsMaterial);
    mars.position.set(8, 4, -10);
    scene.add(mars);

    if (showHabitableZones && isZoomedOnMars) {
      analyzeHabitableZones(isTopographicView ? topographicTextureMars : standardTextureMars, mars);
    }

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
    let isDraggingMars = false;
    let previousMousePosition = {
      x: 0,
      y: 0
    };

    const handleMouseDown = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersectsMars = raycaster.intersectObject(mars);
      const intersectsMercury = raycaster.intersectObject(mercury);

      if (intersectsMars.length > 0) {
        isDraggingMars = true;
        setIsZoomedOnMars(true);
        setStats(marsStats);
      } else if (intersectsMercury.length > 0) {
        isDragging = true;
        setIsZoomedOnMars(false);
        setStats(mercuryStats);
      }

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event: MouseEvent) => {
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      if (isDragging) {
        mercury.rotation.y += deltaMove.x * 0.005;
        mercury.rotation.x += deltaMove.y * 0.005;
      } else if (isDraggingMars) {
        mars.rotation.y += deltaMove.x * 0.005;
        mars.rotation.x += deltaMove.y * 0.005;
      }

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
      isDraggingMars = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);

      if (!isDragging && !isDraggingMars) {
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
  }, [isZoomedOnMars, showHabitableZones, isTopographicView]);

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
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
        <button
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md shadow-lg transition-colors"
          onClick={() => setIsTopographicView(!isTopographicView)}
        >
          {isTopographicView ? 'Vue standard' : 'Vue topographique'}
        </button>
        <button
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md shadow-lg transition-colors"
          onClick={() => setShowHabitableZones(!showHabitableZones)}
        >
          {showHabitableZones ? 'Cacher zones habitables' : 'Montrer zones habitables'}
        </button>
      </div>
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
