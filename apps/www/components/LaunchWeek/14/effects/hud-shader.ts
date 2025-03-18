export const HUDShader = {
  vertexShader: `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragmentShader: `
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D tDiffuse;
uniform vec2    u_resolution;
uniform float   u_time;

varying vec2 vUv;


#ifndef RANDOM_SCALE
#ifdef RANDOM_HIGHER_RANGE
#define RANDOM_SCALE vec4(.1031, .1030, .0973, .1099)
#else
#define RANDOM_SCALE vec4(443.897, 441.423, .0973, .1099)
#endif
#endif

#ifndef FNC_RANDOM
#define FNC_RANDOM
float random(in float x) {
#ifdef RANDOM_SINLESS
    x = fract(x * RANDOM_SCALE.x);
    x *= x + 33.33;
    x *= x + x;
    return fract(x);
#else
    return fract(sin(x) * 43758.5453);
#endif
}

float random(in vec2 st) {
#ifdef RANDOM_SINLESS
    vec3 p3  = fract(vec3(st.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
#else
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
#endif
}

float random(in vec3 pos) {
#ifdef RANDOM_SINLESS
    pos  = fract(pos * RANDOM_SCALE.xyz);
    pos += dot(pos, pos.zyx + 31.32);
    return fract((pos.x + pos.y) * pos.z);
#else
    return fract(sin(dot(pos.xyz, vec3(70.9898, 78.233, 32.4355))) * 43758.5453123);
#endif
}

float random(in vec4 pos) {
#ifdef RANDOM_SINLESS
    pos = fract(pos * RANDOM_SCALE);
    pos += dot(pos, pos.wzxy + 33.33);
    return fract((pos.x + pos.y) * (pos.z + pos.w));
#else
    float dot_product = dot(pos, vec4(12.9898,78.233,45.164,94.673));
    return fract(sin(dot_product) * 43758.5453);
#endif
}

vec2 random2(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 random2(vec2 p) {
    vec3 p3 = fract(p.xyx * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 random2(vec3 p3) {
    p3 = fract(p3 * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 random3(float p) {
    vec3 p3 = fract(vec3(p) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx); 
}

vec3 random3(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * RANDOM_SCALE.xyz);
    p3 += dot(p3, p3.yxz + 19.19);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

vec3 random3(vec3 p) {
    p = fract(p * RANDOM_SCALE.xyz);
    p += dot(p, p.yxz + 19.19);
    return fract((p.xxy + p.yzz) * p.zyx);
}

vec4 random4(float p) {
    vec4 p4 = fract(p * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);   
}

vec4 random4(vec2 p) {
    vec4 p4 = fract(p.xyxy * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec4 random4(vec3 p) {
    vec4 p4 = fract(p.xyzx * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}

vec4 random4(vec4 p4) {
    p4 = fract(p4  * RANDOM_SCALE);
    p4 += dot(p4, p4.wzxy + 19.19);
    return fract((p4.xxyz + p4.yzzw) * p4.zywx);
}
#endif

  void main() {
    // Sample the diffuse texture to get base color with alpha
    vec4 color = texture2D(tDiffuse, vUv);
  
    vec2 pixel = 1.0/u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;

    float d2 = random(vec2(st * 0.5 + u_time));
    float d3 = random(vec3(st * 0.5, u_time));
    
    color += mix(d2, d3, step(0.5, st.x)) * 0.05;
  
    gl_FragColor = color;
  }
`,
  uniforms: {
    tDiffuse: { value: null as any },
    u_time: { value: 0.0 },
    u_resolution: { value: [70.0, 100.0] }, // Adjusted for Lygia noise scale
  }
}
