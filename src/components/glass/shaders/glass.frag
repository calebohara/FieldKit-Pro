// ═══════════════════════════════════════════════════════════
// Liquid Glass — Fragment Shader
// Refractive glass material with:
//   - IOR-based UV distortion (refraction)
//   - 3D simplex noise surface imperfections
//   - Fresnel specular highlight band
//   - Mouse-proximity ripple distortion
//   - Animated caustic shimmer
//   - Chromatic aberration at edges
// ═══════════════════════════════════════════════════════════

precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uMouse;       // normalized [0,1] mouse position
uniform vec2  uResolution;  // viewport dimensions in pixels
uniform float uIOR;         // index of refraction (1.0 = air, 1.5 = glass)
uniform float uOpacity;     // overall glass opacity

// ─── Simplex 3D Noise (Ashima Arts) ───────────────────────
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ─── Fresnel (Schlick approximation) ──────────────────────
float fresnel(vec2 uv, float power) {
  // Simulate surface normal from UV distance to center
  vec2 centered = uv - 0.5;
  float dist = length(centered) * 2.0;
  float f = pow(1.0 - clamp(1.0 - dist, 0.0, 1.0), power);
  return clamp(f, 0.0, 1.0);
}

// ─── Mouse ripple ─────────────────────────────────────────
vec2 ripple(vec2 uv, vec2 mouse, float time) {
  vec2 delta = uv - mouse;
  float dist = length(delta);
  float strength = smoothstep(0.35, 0.0, dist);  // falloff radius
  float wave = sin(dist * 40.0 - time * 4.0) * 0.5 + 0.5;
  return delta * strength * wave * 0.015;
}

// ─── Caustics ─────────────────────────────────────────────
float caustics(vec2 uv, float time) {
  float c = 0.0;
  // Three overlapping wave patterns at different scales
  c += sin(uv.x * 25.0 + time * 0.8) * sin(uv.y * 25.0 - time * 0.6) * 0.5;
  c += sin(uv.x * 17.0 - time * 1.1 + uv.y * 13.0) * 0.3;
  c += sin(length(uv - 0.5) * 30.0 - time * 1.5) * 0.2;
  return c * 0.5 + 0.5; // normalize to [0, 1]
}

// ─── Main ─────────────────────────────────────────────────
void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;

  // ── 1. Noise-based UV distortion (surface imperfections) ──
  float noiseScale = 3.0;
  float noiseSpeed = 0.15;
  float n1 = snoise(vec3(uv * noiseScale, uTime * noiseSpeed));
  float n2 = snoise(vec3(uv * noiseScale + 100.0, uTime * noiseSpeed + 50.0));
  vec2 noiseOffset = vec2(n1, n2) * 0.008;

  // ── 2. IOR refraction distortion ──
  vec2 centered = uv - 0.5;
  float distFromCenter = length(centered * vec2(aspect, 1.0));
  float refractionStrength = (uIOR - 1.0) * 0.15;
  vec2 refractionOffset = centered * distFromCenter * refractionStrength;

  // ── 3. Mouse ripple distortion ──
  vec2 rippleOffset = ripple(uv, uMouse, uTime);

  // ── 4. Combined UV offset ──
  vec2 distortedUv = uv + noiseOffset + refractionOffset + rippleOffset;

  // ── 5. Simulate refracted background color ──
  // Since we can't sample the DOM, we generate a procedural "background"
  // that blends with the underlying CSS backdrop-filter result.
  // This creates the color shift that real glass produces.
  float bg1 = snoise(vec3(distortedUv * 2.0, uTime * 0.05));
  float bg2 = snoise(vec3(distortedUv * 1.5 + 50.0, uTime * 0.08));

  // Deep purple-blue tinted glass base
  vec3 glassBase = vec3(0.12, 0.10, 0.22);
  vec3 glassTint = vec3(0.25, 0.22, 0.45);
  vec3 refractedColor = mix(glassBase, glassTint, bg1 * 0.5 + 0.5);

  // ── 6. Chromatic aberration at edges ──
  float edgeDist = smoothstep(0.3, 0.5, distFromCenter);
  float caR = snoise(vec3(distortedUv * 2.0 + vec2(0.01, 0.0), uTime * 0.1));
  float caB = snoise(vec3(distortedUv * 2.0 - vec2(0.01, 0.0), uTime * 0.1));
  refractedColor.r += caR * edgeDist * 0.04;
  refractedColor.b += caB * edgeDist * 0.06;

  // ── 7. Fresnel specular highlight ──
  float fres = fresnel(uv, 3.0);
  // Specular band — concentrated highlight along top edge
  float specBand = smoothstep(0.85, 1.0, uv.y) * 0.6;
  // Secondary subtle band at bottom
  specBand += smoothstep(0.15, 0.0, uv.y) * 0.15;
  float specular = fres * 0.35 + specBand;

  // ── 8. Caustic shimmer ──
  float caust = caustics(distortedUv, uTime);
  float caustStrength = 0.04; // subtle

  // ── 9. Internal light scattering ──
  float scatter = snoise(vec3(uv * 8.0, uTime * 0.3)) * 0.02;

  // ── 10. Compose final color ──
  vec3 color = refractedColor;
  color += vec3(specular) * vec3(0.7, 0.75, 1.0);       // blue-white specular
  color += vec3(caust * caustStrength) * vec3(0.6, 0.65, 1.0); // blue caustics
  color += scatter;

  // ── 11. Alpha with Fresnel edge brightening ──
  float alpha = uOpacity;
  alpha += fres * 0.15;  // brighter at edges (glass thickness)
  alpha = clamp(alpha, 0.0, 0.85);

  // ── 12. Vignette — darken corners for depth ──
  float vignette = 1.0 - smoothstep(0.3, 0.7, distFromCenter);
  color *= 0.85 + vignette * 0.15;

  gl_FragColor = vec4(color, alpha);
}
