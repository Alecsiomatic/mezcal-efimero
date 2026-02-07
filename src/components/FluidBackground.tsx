import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader - Fluid simulation
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform float uSpeed;
  uniform float uIntensity;
  
  varying vec2 vUv;
  
  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fluid-like distortion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Metaball-like blend
  float metaball(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return radius / (d * d + 0.001);
  }
  
  void main() {
    vec2 uv = vUv;
    float t = uTime * uSpeed;
    
    // Create fluid distortion
    vec2 distortedUv = uv;
    
    // Multiple layers of noise for organic movement
    float noise1 = fbm(vec3(uv * 3.0, t * 0.5)) * uIntensity;
    float noise2 = fbm(vec3(uv * 2.0 + 100.0, t * 0.3)) * uIntensity;
    float noise3 = fbm(vec3(uv * 4.0 + 200.0, t * 0.7)) * uIntensity * 0.5;
    
    distortedUv.x += noise1 * 0.15;
    distortedUv.y += noise2 * 0.15;
    
    // Create flowing liquid blobs
    float blob1 = metaball(distortedUv, vec2(0.3 + sin(t * 0.5) * 0.2, 0.3 + cos(t * 0.4) * 0.2), 0.08);
    float blob2 = metaball(distortedUv, vec2(0.7 + sin(t * 0.6) * 0.2, 0.5 + cos(t * 0.5) * 0.2), 0.06);
    float blob3 = metaball(distortedUv, vec2(0.5 + sin(t * 0.4) * 0.3, 0.7 + cos(t * 0.6) * 0.2), 0.07);
    float blob4 = metaball(distortedUv, vec2(0.2 + sin(t * 0.7) * 0.2, 0.6 + cos(t * 0.3) * 0.3), 0.05);
    float blob5 = metaball(distortedUv, vec2(0.8 + sin(t * 0.3) * 0.15, 0.2 + cos(t * 0.7) * 0.2), 0.04);
    
    // Mouse interaction blob
    float mouseBlob = metaball(distortedUv, uMouse, 0.1);
    
    // Combine all blobs
    float blobs = blob1 + blob2 + blob3 + blob4 + blob5 + mouseBlob * 0.5;
    
    // Create smooth liquid surface
    float liquid = smoothstep(0.4, 1.5, blobs);
    liquid = mix(liquid, fbm(vec3(distortedUv * 5.0, t)) * 0.5 + 0.5, 0.3);
    
    // Color mixing based on position and noise
    float colorMix1 = fbm(vec3(distortedUv * 2.0 + noise1, t * 0.2));
    float colorMix2 = fbm(vec3(distortedUv * 3.0 + noise2, t * 0.3));
    
    vec3 color = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, colorMix1));
    color = mix(color, uColor3, smoothstep(-0.3, 0.7, colorMix2));
    color = mix(color, uColor4, liquid * 0.4);
    
    // Add highlights
    float highlight = pow(liquid, 3.0) * 0.3;
    color += highlight * uColor2;
    
    // Add depth variation
    float depth = fbm(vec3(uv * 1.5, t * 0.1));
    color *= 0.7 + depth * 0.3;
    
    // Vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.8;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface FluidMeshProps {
  colors: string[];
  speed: number;
  intensity: number;
}

function FluidMesh({ colors, speed, intensity }: FluidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uColor1: { value: new THREE.Color(colors[0] || '#0a0806') },
    uColor2: { value: new THREE.Color(colors[1] || '#D4AF37') },
    uColor3: { value: new THREE.Color(colors[2] || '#2C1810') },
    uColor4: { value: new THREE.Color(colors[3] || '#8B7355') },
    uSpeed: { value: speed },
    uIntensity: { value: intensity },
  }), [colors, speed, intensity]);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth mouse following
      const targetX = (state.pointer.x + 1) / 2;
      const targetY = (state.pointer.y + 1) / 2;
      mouseRef.current.x += (targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetY - mouseRef.current.y) * 0.05;
      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
    }
  });

  return (
    <mesh ref={meshRef} scale={[2, 2, 1]}>
      <planeGeometry args={[2, 2, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

interface FluidBackgroundProps {
  colors?: string[];
  speed?: number;
  intensity?: number;
  className?: string;
}

export default function FluidBackground({
  colors = ['#0a0806', '#D4AF37', '#2C1810', '#8B7355'],
  speed = 0.3,
  intensity = 1.0,
  className = '',
}: FluidBackgroundProps) {
  return (
    <div className={`fluid-background ${className}`} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100dvh',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          // Handle context lost
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.log('WebGL context lost - will attempt restore');
          });
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        <FluidMesh colors={colors} speed={speed} intensity={intensity} />
      </Canvas>
    </div>
  );
}
