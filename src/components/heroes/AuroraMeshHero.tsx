import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Liquid-chrome aurora field rendered in a raw WebGL fragment shader.
 *
 * No three.js: this is a single full-screen triangle with all the motion in
 * the fragment stage, which is both far lighter than pulling in a scene graph
 * and the reason it holds 60fps — the GPU shades every pixel in parallel
 * rather than the CPU transforming geometry.
 *
 * Self-contained: takes only display strings, imports nothing from the app.
 */

gsap.registerPlugin(ScrollTrigger);

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/**
 * fbm (fractal Brownian motion) = several octaves of value noise summed at
 * halving amplitude. It is what turns a smooth gradient into something that
 * reads as smoke/liquid rather than a plain blur.
 *
 * The field is then used to *warp its own lookup* (domain warping) twice,
 * which is what produces the folded, marbled chrome look.
 */
const FRAG = `
precision highp float;
uniform vec2      uRes;
uniform float     uTime;
uniform vec2      uMouse;
uniform vec3      uCa;
uniform vec3      uCb;
uniform vec3      uCc;
uniform sampler2D uTex;
uniform float     uHasTex;
uniform float     uTexAspect;
uniform float     uHover;
uniform float     uScroll;
uniform vec2      uFocus;
uniform float     uStylize;
uniform vec2      uTexel;
uniform vec3      uGradA;
uniform vec3      uGradB;
uniform vec3      uGradC;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }

/**
 * Pushes a photograph toward flat illustration.
 *
 * Three things separate painted character art from a photo: values collapse
 * into a few flat bands instead of a smooth ramp, colour is driven by a
 * deliberate palette rather than the camera's, and forms are held by dark
 * edges. So: quantise luminance, gradient-map the result, then multiply in a
 * Sobel edge so contours ink themselves.
 */
vec3 stylize(vec3 c, vec2 tuv){
  float l = luma(c);

  // Flat bands. Smoothstep inside each step keeps the boundaries from
  // aliasing into hard stair-steps on gradients like skin.
  float bands = 6.0;
  float scaled = l * bands;
  float q = (floor(scaled) + smoothstep(0.35, 0.65, fract(scaled))) / bands;

  // Gradient map: shadow -> midtone -> light, as a chosen ramp.
  vec3 mapped = mix(uGradA, uGradB, smoothstep(0.0, 0.6, q));
  mapped = mix(mapped, uGradC, smoothstep(0.55, 1.0, q));

  // Keep a little of the original hue so skin still reads as skin.
  mapped = mix(mapped, c, 0.22);

  // Sobel on luminance, cheap 4-tap version — enough for contour inking.
  float lx = luma(texture2D(uTex, tuv + vec2(uTexel.x, 0.0)).rgb)
           - luma(texture2D(uTex, tuv - vec2(uTexel.x, 0.0)).rgb);
  float ly = luma(texture2D(uTex, tuv + vec2(0.0, uTexel.y)).rgb)
           - luma(texture2D(uTex, tuv - vec2(0.0, uTexel.y)).rgb);
  float edge = smoothstep(0.06, 0.34, length(vec2(lx, ly)));
  mapped *= 1.0 - edge * 0.72;

  // Lift saturation — painted art runs hotter than a camera does.
  float m = luma(mapped);
  mapped = clamp(m + (mapped - m) * 1.35, 0.0, 1.0);

  return mapped;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p  = (gl_FragCoord.xy - 0.5 * uRes.xy) / min(uRes.x, uRes.y);

  float t = uTime * 0.06;
  vec2 drift = (uMouse - 0.5) * 0.35;

  // Two rounds of domain warping — each layer distorts the next one's input.
  vec2 q = vec2(fbm(p + t + drift), fbm(p + vec2(3.4, 1.2) - t));
  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, 9.2) + t * 1.3),
                fbm(p + 2.0 * q + vec2(8.3, 2.8) - t * 0.9));
  float f = fbm(p + 2.2 * r);

  vec3 col = mix(uCa, uCb, clamp(f * f * 2.4, 0.0, 1.0));
  col = mix(col, uCc, clamp(length(q) * 0.85, 0.0, 1.0));

  // Specular-ish sheen along the warp gradient sells the "chrome".
  float sheen = pow(clamp(dot(normalize(r + 0.001), vec2(0.7, 0.7)), 0.0, 1.0), 3.0);
  col += sheen * 0.22;

  if (uHasTex > 0.5) {
    // Cursor in the same centred, aspect-corrected space as p.
    // uMouse arrives already y-up (the pointer handler does 1 - y/height),
    // matching gl_FragCoord. Negating here as well double-flipped it, which
    // is why moving up cleared downward.
    vec2 m = (uMouse * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
    float d = length(p - m);

    // Damped ring ripple radiating from the pointer. exp() falloff keeps it
    // a local disturbance in the wiped patch instead of tiling the frame.
    float ripple = sin(d * 30.0 - uTime * 3.4) * exp(-d * 16.0) * 0.010;
    vec2 dir = normalize(p - m + 0.0001);

    // Cover-fit the portrait across the whole viewport — the fog sits over
    // the entire screen, so whatever the pointer uncovers has to be there.
    // Matching the short axis would letterbox her; this crops the long one.
    // uFocus decides which part of the photo the crop centres on. A plain
    // 0.5 centre samples the middle of the frame, which on a portrait shot
    // is the neck — the face lives in the upper third, so it has to be
    // biased or the pointer uncovers a collarbone.
    // The crop window must stay inside the texture. Offsetting the centre by
    // uFocus alone can push an edge past 0/1, and the clamp below then smears
    // that edge row across a band of the screen — a hard dark stripe where
    // the photo's top pixels repeat. Clamping the *centre* to the window's
    // half-extent honours the focal point as far as it can and stops there.
    float sa = uRes.x / uRes.y;
    vec2 tuv = uv;
    if (sa > uTexAspect) {
      float span = uTexAspect / sa;
      float c    = clamp(1.0 - uFocus.y, span * 0.5, 1.0 - span * 0.5);
      tuv.y = (tuv.y - 0.5) * span + c;
    } else {
      float span = sa / uTexAspect;
      float c    = clamp(uFocus.x, span * 0.5, 1.0 - span * 0.5);
      tuv.x = (tuv.x - 0.5) * span + c;
    }
    tuv.y = 1.0 - tuv.y;
    tuv += dir * ripple;

    vec2 stuv = clamp(tuv, 0.001, 0.999);
    vec3 face = texture2D(uTex, stuv).rgb;
    if (uStylize > 0.0) face = mix(face, stylize(face, stuv), uStylize);

    // Fog is total at rest. Only this small disc clears, and its edge is
    // deliberately soft and noisy — a hard circle reads as a spotlight
    // cut-out, while a ragged one reads as fog actually being wiped away.
    float edge  = fbm(p * 7.0 + t * 2.0) * 0.05;
    float clear = 1.0 - smoothstep(0.06, 0.23 + edge, d);
    // Two independent ways through the fog. The pointer wipes a small patch;
    // scrolling burns the whole bank off. max() rather than sum so a wiped
    // patch never over-brightens once the scroll clear has already passed it.
    float reveal = clamp(max(clear * uHover, uScroll), 0.0, 1.0);

    col = mix(col, face, reveal);

    // Faint warm halo just outside the wiped patch, where the fog thins.
    float halo = (1.0 - smoothstep(0.0, 0.30, d)) - clear;
    col += uCb * max(halo, 0.0) * uHover * 0.10;
  }

  // Vignette relaxes as the fog clears, so the frame opens up on scroll.
  col *= 1.0 - (0.55 - 0.22 * uScroll) * pow(length(p) * 0.85, 2.2);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Compiles and *checks*. GL fails silently by design — a shader that does not
 * compile links into a program that simply draws nothing, so without an
 * explicit COMPILE_STATUS check the only symptom is a blank canvas and no
 * error anywhere. Returns null so the caller can fall back.
 */
function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[AuroraMeshHero] shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export interface AuroraMeshHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Three-stop palette the field mixes between. */
  palette?: [string, string, string];
  /**
   * Optional portrait shown through the aurora. Must be CORS-readable —
   * WebGL refuses to sample a cross-origin image without it, and the whole
   * canvas would be tainted. Omit it for the plain colour field.
   */
  portrait?: string;
  /**
   * Gives the hero two viewports of scroll and burns the fog off across
   * them. Leave it off for a plain fixed-height hero.
   */
  scrollReveal?: boolean;
  /**
   * Which point of the portrait the full-screen crop centres on, 0-1.
   * Default [0.5, 0.5]; drop y toward ~0.3 for a head-and-shoulders shot so
   * the face lands mid-screen rather than the neck.
   */
  portraitFocus?: [number, number];
  /**
   * 0 = untouched photograph, 1 = full flat-illustration treatment
   * (posterised bands, gradient-mapped palette, inked contours).
   */
  stylize?: number;
  /** Shadow / midtone / highlight stops the gradient map ramps through. */
  gradient?: [string, string, string];
}

export default function AuroraMeshHero({
  eyebrow,
  title,
  subtitle,
  palette = ["#0B0A12", "#B08968", "#EFE3D6"],
  portrait,
  scrollReveal = false,
  portraitFocus = [0.5, 0.5],
  stylize = 0,
  gradient = ["#2E1F45", "#C2647A", "#F7DCC4"],
}: AuroraMeshHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  // Written by ScrollTrigger, read by the render loop — a ref rather than
  // state so scrubbing never triggers a React render.
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return undefined;

    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return undefined;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[AuroraMeshHero] program link failed:", gl.getProgramInfoLog(program));
      return undefined;
    }
    gl.useProgram(program);

    // One oversized triangle instead of two triangles: no seam down the
    // diagonal and one less vertex to transform.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uHasTex = gl.getUniformLocation(program, "uHasTex");
    const uTexAspect = gl.getUniformLocation(program, "uTexAspect");
    const uHover = gl.getUniformLocation(program, "uHover");
    const uScroll = gl.getUniformLocation(program, "uScroll");
    gl.uniform1i(gl.getUniformLocation(program, "uTex"), 0);
    gl.uniform1f(uHasTex, 0);
    gl.uniform1f(uTexAspect, 1);
    gl.uniform2f(gl.getUniformLocation(program, "uFocus"), portraitFocus[0], portraitFocus[1]);
    gl.uniform1f(gl.getUniformLocation(program, "uStylize"), stylize);
    gl.uniform3fv(gl.getUniformLocation(program, "uGradA"), hexToRgb(gradient[0]));
    gl.uniform3fv(gl.getUniformLocation(program, "uGradB"), hexToRgb(gradient[1]));
    gl.uniform3fv(gl.getUniformLocation(program, "uGradC"), hexToRgb(gradient[2]));
    const uTexel = gl.getUniformLocation(program, "uTexel");
    gl.uniform2f(uTexel, 1 / 1024, 1 / 1024);
    gl.uniform3fv(gl.getUniformLocation(program, "uCa"), hexToRgb(palette[0]));
    gl.uniform3fv(gl.getUniformLocation(program, "uCb"), hexToRgb(palette[1]));
    gl.uniform3fv(gl.getUniformLocation(program, "uCc"), hexToRgb(palette[2]));

    // --- portrait texture -------------------------------------------------
    let texture: WebGLTexture | null = null;
    let image: HTMLImageElement | null = null;

    if (portrait) {
      texture = gl.createTexture();
      image = new Image();
      // Must be set before `src`, or the request goes out without the CORS
      // header and the texture upload taints the canvas.
      image.crossOrigin = "anonymous";
      image.onload = () => {
        if (!texture || !image) return;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Photos are never power-of-two, so mipmaps and REPEAT are illegal
        // here — clamp + linear is the only valid combination.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1f(uTexAspect, image.naturalWidth / image.naturalHeight);
        // The edge pass steps one texel; a wrong step size either misses
        // contours or smears them into a halo.
        gl.uniform2f(uTexel, 1 / image.naturalWidth, 1 / image.naturalHeight);
        gl.uniform1f(uHasTex, 1);
      };
      image.onerror = () => {
        console.warn("[AuroraMeshHero] portrait failed to load; showing colour field only");
      };
      image.src = portrait;
    }

    const mouse = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    // Eased 0..1. Drives how far the aurora parts and how strong the ripple
    // is, so the reveal fades in and out instead of snapping.
    let hover = 0;
    let hoverGoal = 0;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
      hoverGoal = 1;
    };
    const onLeave = () => { hoverGoal = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const resize = () => {
      // Cap DPR at 2: the shader is fill-rate bound, and past 2x the extra
      // pixels cost frames without being visible.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();

    const render = () => {
      mouse.x += (target.x - mouse.x) * 0.22;
      mouse.y += (target.y - mouse.y) * 0.22;
      hover += (hoverGoal - hover) * 0.10;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uScroll, scrollRef.current);
      gl.uniform1f(uTime, reduced ? 12 : (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced) frame = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (image) { image.onload = null; image.onerror = null; }
      if (texture) gl.deleteTexture(texture);
      // Deliberately NOT calling WEBGL_lose_context.loseContext() here.
      // A lost context is permanent for that canvas element, and any
      // remount — StrictMode's double-invoke in dev, or simply toggling
      // this hero back on — reuses the same <canvas>. The second mount
      // then gets a dead context in which every shader fails to compile
      // and getShaderInfoLog() returns null, i.e. a blank canvas with no
      // usable error. Dropping the references is enough; the browser
      // reclaims the context on its own.
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buffer);
    };
  }, [palette, portrait, portraitFocus, stylize, gradient]);

  /**
   * Scrubs the fog away across the track's scroll length.
   *
   * Deliberately CSS `position: sticky` for the visual hold rather than
   * ScrollTrigger's `pin`. Pinning clones the element into a pin-spacer,
   * which would tear down and re-create the WebGL canvas mid-scroll and lose
   * the context. Sticky leaves the node exactly where it is, so the shader
   * keeps running and ScrollTrigger only has to move one number.
   */
  useLayoutEffect(() => {
    if (!scrollReveal || !trackRef.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scrollRef.current = 1;
      return undefined;
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: trackRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => { scrollRef.current = self.progress; },
      });
    }, trackRef);

    return () => ctx.revert();
  }, [scrollReveal]);

  const stage = (
    <Box sx={{ position: "relative", height: "100dvh", width: "100%", overflow: "hidden", bgcolor: "#0B0A12" }}>
      <Box
        component="canvas"
        ref={canvasRef}
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          p: { xs: 3, md: 8 },
        }}
      >
        {eyebrow && (
          <Typography
            sx={{
              fontSize: { xs: 10, md: 12 },
              fontWeight: 700,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.7)",
              mb: 2,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          component="h1"
          sx={{
            fontSize: "clamp(3rem,11vw,10rem)",
            fontWeight: 800,
            lineHeight: 0.82,
            letterSpacing: "-0.04em",
            color: "#fff",
            mixBlendMode: "difference",
            whiteSpace: "pre-line",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              mt: 3,
              maxWidth: 460,
              fontSize: { xs: 13, md: 16 },
              color: "rgba(255,255,255,.75)",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );

  if (!scrollReveal) return stage;

  return (
    <Box ref={trackRef} sx={{ position: "relative", height: "220vh" }}>
      <Box sx={{ position: "sticky", top: 0 }}>{stage}</Box>
    </Box>
  );
}
