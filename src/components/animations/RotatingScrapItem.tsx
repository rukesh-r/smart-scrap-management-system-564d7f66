import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface RotatingScrapItemProps {
  type?: 'can' | 'bottle' | 'box' | 'paper';
  size?: number;
  color?: string;
  className?: string;
}

const RotatingScrapItem = ({ 
  type = 'can', 
  size = 100, 
  color = '#4CAF50',
  className = '' 
}: RotatingScrapItemProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create geometry based on type
    let geometry: THREE.BufferGeometry;
    switch (type) {
      case 'can':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
        break;
      case 'bottle':
        geometry = new THREE.SphereGeometry(0.4, 16, 16);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        break;
      case 'paper':
        geometry = new THREE.PlaneGeometry(0.8, 0.6);
        break;
      default:
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    }

    const material = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(color),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    camera.position.z = 2;

    // Animation
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
      mesh.position.y = Math.sin(Date.now() * 0.002) * 0.1;
      
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [type, size, color]);

  return (
    <div 
      ref={mountRef} 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default RotatingScrapItem;