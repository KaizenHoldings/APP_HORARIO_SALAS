/**
 * Shader de Grainient en SkSL (react-native-skia), en una sola pasada.
 *
 * Es el FIELD + COMPOSITE del original WebGL con estas adaptaciones:
 * - Uniforms enteros pasados como float (uCount, uType).
 * - Sin interacción táctil (stir / twirl): la tablet es un kiosco.
 * - `fwidth` no existe en SkSL; el borde usa un mínimo fijo (con softness > 0 no cambia nada).
 * - Skia tiene el origen arriba-izquierda: se invierte Y para conservar la dirección del ángulo.
 * - El grano se calcula sobre coordenadas de layout (uPixelScale) y no de la textura reducida.
 */
export const GRAINIENT_SKSL = `
uniform float2 uResolution;
uniform float uPixelScale;
uniform float uTime;
uniform float3 uRamp[8];
uniform float uCount;
uniform float uType;
uniform float2 uDir;
uniform float uExtent;
uniform float uBands;
uniform float uSoftness;
uniform float uFlow;
uniform float uScale;
uniform float uSilk;
uniform float2 uSeed;
uniform float uContrast;
uniform float uSaturation;
uniform float uSettle;
uniform float uReveal;
uniform float uGrain;
uniform float uGrainSize;
uniform float uFrame;

float2 hash2(float2 p) {
  float3 q = fract(float3(p.xyx) * float3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + float2(1.0, 0.0)), f - float2(1.0, 0.0));
  float c = dot(hash2(i + float2(0.0, 1.0)), f - float2(0.0, 1.0));
  float d = dot(hash2(i + float2(1.0, 1.0)), f - float2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float2 drift(float2 p, float t) {
  float2 w1 = float2(
    noise(p * 0.85 + float2(t * 0.11, t * 0.07)),
    noise(p * 0.85 + float2(4.1, 1.7) - float2(t * 0.08, t * 0.12))
  );
  float2 w2 = float2(
    noise(p * 1.55 + w1 * 1.8 + float2(1.3, 7.1) + t * 0.05),
    noise(p * 1.55 + w1 * 1.8 + float2(6.4, 2.2) - t * 0.06)
  );
  return (w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.55;
}

float2 warp(float2 p) {
  float2 q = p / uScale;
  if (uType > 0.5) {
    float turn = uTime * 0.35;
    q = float2x2(cos(turn), sin(turn), -sin(turn), cos(turn)) * q;
  } else {
    q += float2(-uDir.y, uDir.x) * uTime * 0.45;
  }
  return p + drift(q + uSeed, uTime) * uFlow * uScale * uSettle;
}

float coord(float2 p) {
  float2 w = warp(p);
  return uType > 0.5 ? 1.0 - length(w) * 1.1 : dot(w, uDir) / uExtent + 0.5;
}

float3 labToRgb(float3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return float3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

float3 encode(float3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, float3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

float hash(float2 p) {
  float3 q = fract(float3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float clump(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + float2(1.0, 0.0)), u.x), mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x), u.y);
}

half4 main(float2 fragCoord) {
  float2 vUv = float2(fragCoord.x / uResolution.x, 1.0 - fragCoord.y / uResolution.y);
  float aspect = uResolution.x / uResolution.y;
  float2 p = (vUv - 0.5) * float2(aspect, 1.0);

  float raw = coord(p);
  float s = raw;
  if (uBands > 1.0) {
    s *= uBands;
    float cycle = floor(s);
    s = fract(s);
    if (mod(cycle, 2.0) > 0.5) s = 1.0 - s;
  }
  s = clamp(s, 0.0, 1.0);
  float scaled = s * (uCount - 1.0);
  float index = min(floor(scaled), uCount - 2.0);
  float f = scaled - index;
  float edge = max(uSoftness * 0.5, 0.002);
  float shaped = smoothstep(0.5 - edge, 0.5 + edge, f);
  float3 from = uRamp[0];
  float3 to = uRamp[1];
  for (int i = 0; i < 7; i++) {
    if (float(i) == index) {
      from = uRamp[i];
      to = uRamp[i + 1];
    }
  }
  float3 lab = mix(from, to, shaped);
  if (uSilk > 0.0) {
    float2 grad = float2(coord(p + float2(0.004, 0.0)) - raw, coord(p + float2(0.0, 0.004)) - raw) / 0.004;
    float2 slope = grad * sin(3.14159265 * clamp(raw, 0.0, 1.0) * uBands) * uSilk * 4.0;
    float3 normal = normalize(float3(-slope, 1.0));
    float3 light = normalize(float3(-uDir.y, uDir.x, 1.2));
    float diffuse = dot(normal, light) - light.z;
    lab = uRamp[0] + (lab - uRamp[0]) * (1.0 + (diffuse * 0.35 + max(diffuse, 0.0) * diffuse * 0.6) * uSilk);
  }
  lab = mix(uRamp[0], lab, smoothstep(0.0, 1.0, uReveal * 1.5 - length(vUv - 0.5) * 0.6));
  lab.x = (lab.x - 0.55) * uContrast + 0.55;
  lab.yz *= uSaturation;
  float3 color = encode(labToRgb(lab));

  float2 pixel = fragCoord * uPixelScale + uFrame * float2(17.0, 59.0);
  float fine = hash(pixel) + hash(pixel + 7.13) - 1.0;
  float coarse = (clump(pixel / max(uGrainSize, 1.0)) - 0.5) * 2.0;
  float grain = mix(fine, coarse, clamp(uGrainSize - 1.0, 0.0, 1.0) * 0.8);
  float luma = dot(color, float3(0.2126, 0.7152, 0.0722));
  color += grain * uGrain * (0.45 + 2.2 * luma * (1.0 - luma));
  return half4(half3(clamp(color, 0.0, 1.0)), 1.0);
}
`;
