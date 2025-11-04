import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ScrapBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create floating scrap items
    const scrapItems: THREE.Mesh[] = [];
    const scrapGeometries = [
      new THREE.BoxGeometry(0.5, 0.5, 0.5), // Metal scraps
      new THREE.CylinderGeometry(0.3, 0.3, 0.8), // Cans
      new THREE.SphereGeometry(0.4), // Bottles
      new THREE.PlaneGeometry(0.6, 0.4), // Paper
    ];

    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 100 }), // Metal
      new THREE.MeshPhongMaterial({ color: 0x4CAF50 }), // Green plastic
      new THREE.MeshPhongMaterial({ color: 0x2196F3 }), // Blue plastic
      new THREE.MeshPhongMaterial({ color: 0xFFC107 }), // Paper
    ];

    // Create 20 floating scrap items
    for (let i = 0; i < 20; i++) {
      const geometry = scrapGeometries[Math.floor(Math.random() * scrapGeometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const scrap = new THREE.Mesh(geometry, material);
      
      scrap.position.x = (Math.random() - 0.5) * 20;
      scrap.position.y = (Math.random() - 0.5) * 20;
      scrap.position.z = (Math.random() - 0.5) * 20;
      
      scrap.rotation.x = Math.random() * Math.PI;
      scrap.rotation.y = Math.random() * Math.PI;
      
      scene.add(scrap);
      scrapItems.push(scrap);
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    camera.position.z = 10;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      scrapItems.forEach((scrap, index) => {
        scrap.rotation.x += 0.01;
        scrap.rotation.y += 0.01;
        scrap.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
        scrap.position.x += Math.cos(Date.now() * 0.0008 + index) * 0.001;
      });
      
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

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 -z-10 opacity-20"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ScrapBackground;