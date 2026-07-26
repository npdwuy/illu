"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Edit3, Trash2, ArrowUpRight, Sparkles, MessageSquare } from "lucide-react";

const RenderTarget = {
    current: () => "preview",
    canvas: "canvas",
    export: "export",
    thumbnail: "thumbnail",
    preview: "preview",
};

const DEFAULT_IMAGE =
    "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/3fb4a247-64e9-4c54-2391-86598eebfe00/w=800";

type ResponsiveImageSource =
    | string
    | {
        src?: string;
        srcSet?: string | Array<{ src?: string }>;
        url?: string;
        default?: string;
        asset?: { url?: string };
        alt?: string;
    }
    | null
    | undefined;

export interface StickerDragProps {
    id?: string;
    image?: ResponsiveImageSource;
    imageWidth?: number;
    imageHeight?: number;
    x?: number;
    y?: number;
    description?: string;
    tilt?: number;
    tiltSmoothing?: number;
    lighting?: boolean;
    lightingStrength?: number;
    lightingColor?: string;
    sheenMode?: "sheen" | "holo";
    elevation?: number;
    staticShadow?: string;
    dynamicShadow?: string;
    style?: React.CSSProperties;
    zIndex?: number;
    isSelected?: boolean;
    onPositionChange?: (id: string, newX: number, newY: number) => void;
    onSelect?: (id: string) => void;
    onEditDescription?: (id: string) => void;
    onDelete?: (id: string) => void;
    onBringToFront?: (id: string) => void;
    onResizeWidth?: (id: string, newWidth: number) => void;
}

const RENDER_SCALE = 2;
const PAD_BASE = 20;
const MESH_GRID_SIZE = 32;
const DRAG_Z_INDEX_BASE = 1000;

let zIndexCounter = DRAG_Z_INDEX_BASE;

function getNextZIndex(): number {
    zIndexCounter += 1;
    return zIndexCounter;
}

const DRAG_TILT_SENSITIVITY = 3;
const DRAG_TILT_SMOOTHING = 0.05;
const SHEEN_TILT_SHIFT = 0.05;
const SHEEN_TILT_DEADZONE = 0.035;
const ANIM_SPEED = 1.92;
const HOLO_MOTION_BUMP = 0.15;
const HOLO_MOTION_DECAY = 0.88;

const VERTEX_SHADER = `
attribute vec2 aPos;
attribute vec2 aUV;
uniform float uPeel;
uniform float uLift;
uniform float uPeelAngle;
uniform float uPasting;
uniform float uScale;
uniform float uElevation;
varying vec2 vUV;
varying float vHi;
varying float vSh;

void main() {
    vUV = aUV;
    vec2 p = aPos;
    vHi = 0.0;
    vSh = 0.0;

    if (uPeel > 0.0) {
        vec2 peelAxis = vec2(cos(uPeelAngle), sin(uPeelAngle));
        vec2 uvCentered = aUV - vec2(0.5);
        float proj = dot(uvCentered, peelAxis);
        float diag = 0.5 - proj;

        float peelLine = -0.3 + uPeel * 2.0;

        float rampWidth = 0.6;
        float lifted = smoothstep(peelLine - rampWidth, peelLine, diag);
        lifted = 1.0 - lifted;

        float scale = 1.0 + lifted * uElevation;
        p *= scale;

        float inRamp = smoothstep(peelLine - rampWidth, peelLine - rampWidth * 0.5, diag) *
                       smoothstep(peelLine + 0.05, peelLine - rampWidth * 0.3, diag);

        float curveAmount = uPasting > 0.5 ? 0.06 : 0.12;
        p += (-peelAxis) * inRamp * curveAmount;

        float t = smoothstep(peelLine - rampWidth, peelLine, diag);
        vHi = inRamp * 0.75 * pow(1.0 - t, 1.2);
        vSh = inRamp * 0.75 * pow(t, 1.2);
    }

    gl_Position = vec4(p * uScale, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uTilt;
uniform float uSheenStrength;
uniform float uSheenTiltShift;
uniform float uSheenTiltDeadzone;
uniform float uMaxTiltDeg;
uniform float uHoloMode;
uniform float uHoloMotion;
uniform vec3 uSheenColor;
varying vec2 vUV;
varying float vHi;
varying float vSh;

vec3 overlayBlend(vec3 base, vec3 blend) {
    return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(0.5, base));
}

vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(x, 0.0, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

void main() {
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < 0.01) discard;

    vec3 c = tex.rgb * 0.95;

    float maxTilt = max(0.001, uMaxTiltDeg);
    float tiltMag = clamp(length(uTilt) / maxTilt, 0.0, 1.0);
    float tiltGate = smoothstep(uSheenTiltDeadzone, 1.0, tiltMag);

    float gradient = fract(vUV.x * 0.5 + vUV.y * 0.5 + uTilt.x * uSheenTiltShift + uTilt.y * uSheenTiltShift);

    // White & Blue light sheen effect (No 7-color rainbow)
    float effectStrength = uSheenStrength * (uHoloMode > 0.5 ? max(tiltGate, uHoloMotion) : tiltGate);
    float sheen = smoothstep(0.2, 0.5, gradient) * (1.0 - smoothstep(0.5, 0.8, gradient));

    vec3 blueGlow = vec3(0.22, 0.62, 1.0); // Electric Blue
    vec3 whiteLight = vec3(1.0, 1.0, 1.0); // Pure White Light
    vec3 sheenColorMix = mix(uSheenColor, mix(whiteLight, blueGlow, sin(gradient * 3.14159)), 0.6);

    c = mix(c, sheenColorMix, sheen * effectStrength * tex.a);

    float hiW = clamp(vHi, 0.0, 1.0) * 0.55;
    float shW = clamp(vSh, 0.0, 1.0) * 0.60;

    vec3 hi = overlayBlend(c, vec3(1.0));
    c = mix(c, hi, hiW);

    vec3 sh = overlayBlend(c, vec3(0.0));
    c = mix(c, sh, shW);
    c *= (1.0 - shW * 0.35);

    c = clamp(c, 0.0, 1.0);
    gl_FragColor = vec4(c, tex.a);
}
`;

const resolveImageSource = (
    input?: ResponsiveImageSource
): string | undefined => {
    if (!input) return undefined;
    if (typeof input === "string") return input.trim() || undefined;
    return input.src || input.url || input.asset?.url || undefined;
};

function parseColorToRgb(input?: string): [number, number, number] {
    if (!input) return [1, 1, 1];
    const s = input.trim();
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
    let h = s.replace(/^#/, "");
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("");
    if (h.length >= 6)
        return [
            parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255,
        ];
    return [1, 1, 1];
}

const ELEVATION_INTERNAL_MAX = 0.3;
const STATIC_SHADOW_DEFAULT = "0px 1px 2px 0px rgba(0, 0, 0, 0.30)";
const DYNAMIC_SHADOW_DEFAULT = "0px 13px 14px 0px rgba(0, 0, 0, 0.30)";

interface ParsedShadow {
    x: number;
    y: number;
    blur: number;
    color: string;
}

function parseBoxShadow(shadow: string): ParsedShadow {
    const result: ParsedShadow = {
        x: 0,
        y: 0,
        blur: 0,
        color: "rgba(0,0,0,0.3)",
    };

    if (!shadow) return result;

    const colorMatch = shadow.match(
        /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\b[a-z]+\b(?=\s*$))/i
    );
    if (colorMatch) {
        result.color = colorMatch[0];
    }

    const numbers = shadow.match(/-?\d+(\.\d+)?(px)?/g);
    if (numbers) {
        const vals = numbers.map((n) => parseFloat(n));
        if (vals.length >= 1) result.x = vals[0];
        if (vals.length >= 2) result.y = vals[1];
        if (vals.length >= 3) result.blur = vals[2];
    }

    return result;
}

function lerpShadow(a: ParsedShadow, b: ParsedShadow, t: number): string {
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const blur = a.blur + (b.blur - a.blur) * t;
    const color = t > 0.5 ? b.color : a.color;
    return `drop-shadow(${x.toFixed(2)}px ${y.toFixed(2)}px ${blur.toFixed(2)}px ${color})`;
}

export default function StickerDrag(props: StickerDragProps) {
    const {
        id = "sticker-1",
        image,
        imageWidth = 400,
        imageHeight = 300,
        x = 50,
        y = 50,
        description = "",
        tilt = 15,
        tiltSmoothing = 0.05,
        lighting = true,
        lightingStrength = 1,
        lightingColor = "#ffffff",
        sheenMode = "sheen",
        elevation: elevationLevel = 5,
        staticShadow = STATIC_SHADOW_DEFAULT,
        dynamicShadow = DYNAMIC_SHADOW_DEFAULT,
        style,
        zIndex = 10,
        isSelected = false,
        onPositionChange,
        onSelect,
        onEditDescription,
        onDelete,
        onBringToFront,
        onResizeWidth,
    } = props;

    const tiltSensitivity = DRAG_TILT_SENSITIVITY;
    const maxTilt = Math.max(1, tilt);
    const sheenStrength = lighting
        ? Math.max(1, Math.min(10, lightingStrength)) / 10
        : 0;
    const sheenColor = React.useMemo(
        () => parseColorToRgb(lightingColor),
        [lightingColor]
    );
    const elevation =
        (Math.max(1, Math.min(10, elevationLevel)) / 10) *
        ELEVATION_INTERNAL_MAX;

    const containerRef = useRef<HTMLDivElement>(null);
    const stickerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [currentPos, setCurrentPos] = useState({ x, y });
    const [currentZIndex, setCurrentZIndex] = useState(zIndex);
    const [showControls, setShowControls] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setCurrentPos({ x, y });
    }, [x, y]);

    useEffect(() => {
        setCurrentZIndex(zIndex);
    }, [zIndex]);

    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const vboRef = useRef<WebGLBuffer | null>(null);
    const iboRef = useRef<WebGLBuffer | null>(null);
    const indexCountRef = useRef<number>(0);

    const stateRef = useRef({
        x: currentPos.x,
        y: currentPos.y,
        width: imageWidth,
        height: imageHeight,
        scale: 1.0,

        held: false,
        peeling: false,
        sticking: false,
        dragStartX: 0,
        dragStartY: 0,
        dragOrigX: currentPos.x,
        dragOrigY: currentPos.y,

        peel: 0,
        lift: 0,
        peelAngle: -Math.PI / 4,

        dragTiltX: 0,
        dragTiltY: 0,
        currentTiltX: 0,
        currentTiltY: 0,
        prevTiltX: 0,
        prevTiltY: 0,

        holoMotion: 0,

        lastMoveX: 0,
        lastMoveY: 0,
        lastMoveT: 0,

        texReady: false,
    });

    const animationRef = useRef<number | null>(null);
    const lastTickTRef = useRef<number | null>(null);

    const draw = useCallback(() => {
        const gl = glRef.current;
        const program = programRef.current;
        const texture = textureRef.current;
        const state = stateRef.current;

        if (!gl || !program || !texture || !state.texReady) return;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, vboRef.current);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iboRef.current);

        const aPos = gl.getAttribLocation(program, "aPos");
        const aUV = gl.getAttribLocation(program, "aUV");
        gl.enableVertexAttribArray(aPos);
        gl.enableVertexAttribArray(aUV);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

        gl.uniform1f(gl.getUniformLocation(program, "uPeel"), state.peel);
        gl.uniform1f(gl.getUniformLocation(program, "uLift"), state.lift);
        gl.uniform1f(gl.getUniformLocation(program, "uPeelAngle"), state.peelAngle);
        gl.uniform1f(gl.getUniformLocation(program, "uPasting"), state.sticking ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(program, "uScale"), state.scale);
        gl.uniform1f(gl.getUniformLocation(program, "uElevation"), elevation);

        gl.uniform2f(gl.getUniformLocation(program, "uTilt"), state.currentTiltX, state.currentTiltY);
        gl.uniform1f(gl.getUniformLocation(program, "uSheenStrength"), sheenStrength);
        gl.uniform3f(gl.getUniformLocation(program, "uSheenColor"), sheenColor[0], sheenColor[1], sheenColor[2]);
        gl.uniform1f(gl.getUniformLocation(program, "uSheenTiltShift"), SHEEN_TILT_SHIFT);
        gl.uniform1f(gl.getUniformLocation(program, "uSheenTiltDeadzone"), SHEEN_TILT_DEADZONE);
        gl.uniform1f(gl.getUniformLocation(program, "uMaxTiltDeg"), maxTilt);
        gl.uniform1f(gl.getUniformLocation(program, "uHoloMode"), sheenMode === "holo" ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(program, "uHoloMotion"), state.holoMotion);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, "uTex"), 0);

        gl.drawElements(gl.TRIANGLES, indexCountRef.current, gl.UNSIGNED_SHORT, 0);
    }, [sheenStrength, sheenColor, sheenMode, elevation, maxTilt]);

    const parsedStaticShadow = React.useMemo(() => parseBoxShadow(staticShadow), [staticShadow]);
    const parsedDynamicShadow = React.useMemo(() => parseBoxShadow(dynamicShadow), [dynamicShadow]);

    const updateShadowCSS = useCallback(() => {
        const canvas = canvasRef.current;
        const state = stateRef.current;
        if (!canvas) return;

        const tRaw = Math.max(state.lift, state.peel);
        const t = tRaw * tRaw * (3 - 2 * tRaw);

        canvas.style.filter = lerpShadow(parsedStaticShadow, parsedDynamicShadow, t);
    }, [parsedStaticShadow, parsedDynamicShadow]);

    const tick = useCallback(
        (timestamp: number) => {
            const state = stateRef.current;

            if (lastTickTRef.current === null) {
                lastTickTRef.current = timestamp;
            }

            const dt = Math.min((timestamp - lastTickTRef.current) / 1000, 0.1);
            lastTickTRef.current = timestamp;

            const step = ANIM_SPEED * dt;
            let changed = false;

            if (state.peeling) {
                if (state.peel < 1 || state.lift < 1) {
                    state.peel = Math.min(1, state.peel + step);
                    state.lift = Math.min(1, state.lift + step);
                    changed = true;
                }
            }

            if (state.sticking) {
                if (state.peel > 0 || state.lift > 0) {
                    state.peel = Math.max(0, state.peel - step);
                    state.lift = Math.max(0, state.lift - step);
                    changed = true;
                } else {
                    state.sticking = false;
                }
            }

            const holoDecayActive = sheenMode === "holo" && state.holoMotion > 0.005;
            if (holoDecayActive) {
                state.holoMotion *= HOLO_MOTION_DECAY;
                if (state.holoMotion < 0.005) state.holoMotion = 0;
                changed = true;
            }

            if (changed) {
                updateShadowCSS();
            }

            if (changed || state.held || holoDecayActive) {
                draw();
            }

            if (state.held || state.peeling || state.sticking || holoDecayActive) {
                animationRef.current = requestAnimationFrame(tick);
            } else {
                animationRef.current = null;
                lastTickTRef.current = null;
            }
        },
        [draw, updateShadowCSS, sheenMode]
    );

    const ensureTickRunning = useCallback(() => {
        if (animationRef.current !== null) return;
        lastTickTRef.current = null;
        animationRef.current = requestAnimationFrame(tick);
    }, [tick]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
        });
        if (!gl) return;

        glRef.current = gl;

        const compileShader = (source: string, type: number): WebGLShader | null => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER);
        const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return;
        }

        programRef.current = program;

        const N = MESH_GRID_SIZE;
        const verts: number[] = [];
        const inds: number[] = [];

        for (let j = 0; j <= N; j++) {
            for (let i = 0; i <= N; i++) {
                verts.push((i / N) * 2 - 1, (j / N) * 2 - 1, i / N, 1 - j / N);
            }
        }

        for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
                const a = j * (N + 1) + i;
                inds.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1);
            }
        }

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        vboRef.current = vbo;

        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inds), gl.STATIC_DRAW);
        iboRef.current = ibo;
        indexCountRef.current = inds.length;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            gl.deleteShader(vs);
            gl.deleteShader(fs);
            gl.deleteProgram(program);
            if (vboRef.current) gl.deleteBuffer(vboRef.current);
            if (iboRef.current) gl.deleteBuffer(iboRef.current);
            if (textureRef.current) gl.deleteTexture(textureRef.current);
        };
    }, []);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        const sticker = stickerRef.current;
        const gl = glRef.current;
        const state = stateRef.current;

        if (!canvas || !sticker || !gl) return;

        const width = imageWidth > 0 ? imageWidth : 400;
        const height = imageHeight > 0 ? imageHeight : 300;

        const maxDim = Math.max(width, height);
        const elevationPad = maxDim * elevation * 0.6;
        const effectivePad = PAD_BASE + elevationPad;
        const canvasWidth = width + effectivePad * 2;
        const canvasHeight = height + effectivePad * 2;

        const scaleX = width / canvasWidth;
        const scaleY = height / canvasHeight;
        const scale = Math.min(scaleX, scaleY);

        canvas.width = Math.round(canvasWidth * RENDER_SCALE);
        canvas.height = Math.round(canvasHeight * RENDER_SCALE);
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        canvas.style.position = "absolute";
        canvas.style.left = `${-effectivePad}px`;
        canvas.style.top = `${-effectivePad}px`;

        sticker.style.width = `${width}px`;
        sticker.style.height = `${height}px`;

        state.width = width;
        state.height = height;
        state.scale = scale;

        gl.viewport(0, 0, canvas.width, canvas.height);

        if (state.texReady) {
            draw();
        }
    }, [draw, elevation, imageWidth, imageHeight]);

    useEffect(() => {
        const imageSrc = resolveImageSource(image) || DEFAULT_IMAGE;

        const gl = glRef.current;
        if (!gl || !programRef.current) return;

        let isCancelled = false;

        const loadImage = (src: string) => {
            const img = new Image();
            if (!src.startsWith("data:")) {
                img.crossOrigin = "anonymous";
            }

            const handleLoad = () => {
                if (isCancelled) return;
                const state = stateRef.current;

                if (textureRef.current) {
                    gl.deleteTexture(textureRef.current);
                }

                const texture = gl.createTexture();
                if (!texture) return;

                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                textureRef.current = texture;
                state.texReady = true;

                handleResize();
                updateShadowCSS();
            };

            const handleError = () => {
                if (isCancelled) return;
                console.warn("Lỗi tải ảnh sticker từ URL, chuyển sang ảnh dự phòng:", src);
                if (src !== DEFAULT_IMAGE) {
                    loadImage(DEFAULT_IMAGE);
                }
            };

            img.src = src;
            if (img.decode) {
                img.decode().then(handleLoad).catch(handleError);
            } else {
                img.onload = handleLoad;
                img.onerror = handleError;
            }
        };

        loadImage(imageSrc);

        return () => {
            isCancelled = true;
            stateRef.current.texReady = false;
        };
    }, [image, handleResize, updateShadowCSS]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (onSelect) onSelect(id);
            
            setIsDragging(true);

            const state = stateRef.current;
            const container = containerRef.current;
            const sticker = stickerRef.current;
            const inner = innerRef.current;
            if (!container || !sticker || !inner) return;

            const rect = sticker.getBoundingClientRect();

            const grabOffsetX = e.clientX - rect.left;
            const grabOffsetY = e.clientY - rect.top;
            inner.style.transformOrigin = `${grabOffsetX}px ${grabOffsetY}px`;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            state.peelAngle = Math.atan2(dy, dx);

            state.dragStartX = e.clientX;
            state.dragStartY = e.clientY;
            state.dragOrigX = currentPos.x;
            state.dragOrigY = currentPos.y;

            state.peel = 0;
            state.lift = 0;

            state.held = true;
            state.peeling = true;
            state.sticking = false;

            state.lastMoveX = e.clientX;
            state.lastMoveY = e.clientY;
            state.lastMoveT = performance.now();

            const topZ = getNextZIndex();
            setCurrentZIndex(topZ);
            if (onBringToFront) onBringToFront(id);

            ensureTickRunning();
        },
        [currentPos, ensureTickRunning, id, onBringToFront, onSelect]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const state = stateRef.current;
            if (!state.held) return;

            const inner = innerRef.current;
            if (!inner) return;

            const newX = state.dragOrigX + (e.clientX - state.dragStartX);
            const newY = state.dragOrigY + (e.clientY - state.dragStartY);

            state.x = newX;
            state.y = newY;
            setCurrentPos({ x: newX, y: newY });

            const now = performance.now();
            const dt = Math.max(1, now - state.lastMoveT);
            const velX = ((e.clientX - state.lastMoveX) / dt) * 16;
            const velY = ((e.clientY - state.lastMoveY) / dt) * 16;
            state.lastMoveX = e.clientX;
            state.lastMoveY = e.clientY;
            state.lastMoveT = now;

            const targetTiltY = Math.max(-maxTilt, Math.min(maxTilt, velX * tiltSensitivity));
            const targetTiltX = Math.max(-maxTilt, Math.min(maxTilt, -velY * tiltSensitivity));

            state.dragTiltX += (targetTiltX - state.dragTiltX) * tiltSmoothing;
            state.dragTiltY += (targetTiltY - state.dragTiltY) * tiltSmoothing;

            state.currentTiltX = state.dragTiltX;
            state.currentTiltY = state.dragTiltY;

            if (sheenMode === "holo") {
                const tiltDelta =
                    Math.abs(state.dragTiltX - state.prevTiltX) +
                    Math.abs(state.dragTiltY - state.prevTiltY);
                state.holoMotion = Math.min(1, state.holoMotion + tiltDelta * HOLO_MOTION_BUMP);
                state.prevTiltX = state.dragTiltX;
                state.prevTiltY = state.dragTiltY;
            }

            inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            const state = stateRef.current;
            if (!state.held) return;

            const inner = innerRef.current;

            state.held = false;
            state.peeling = false;
            state.sticking = true;

            if (onPositionChange) {
                onPositionChange(id, state.x, state.y);
            }

            if (state.peel >= 0.95 && inner) {
                const rect = inner.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const dx = state.lastMoveX - centerX;
                const dy = state.lastMoveY - centerY;
                state.peelAngle = Math.atan2(-dy, -dx);
                state.peel = 1;
            }

            const settleTilt = () => {
                state.dragTiltX *= 0.9;
                state.dragTiltY *= 0.9;
                state.currentTiltX = state.dragTiltX;
                state.currentTiltY = state.dragTiltY;

                if (inner) {
                    inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`;
                }

                if (Math.abs(state.dragTiltX) > 0.1 || Math.abs(state.dragTiltY) > 0.1) {
                    requestAnimationFrame(settleTilt);
                } else {
                    state.dragTiltX = 0;
                    state.dragTiltY = 0;
                    state.currentTiltX = 0;
                    state.currentTiltY = 0;
                    state.prevTiltX = 0;
                    state.prevTiltY = 0;
                    if (inner) {
                        inner.style.transform = "";
                    }
                }
            };
            settleTilt();

            ensureTickRunning();
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, tiltSensitivity, tiltSmoothing, ensureTickRunning, sheenMode, maxTilt, id, onPositionChange]);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            e.stopPropagation();
            if (onSelect) onSelect(id);
            
            setIsDragging(true);
            const touch = e.touches[0];
            if (!touch) return;

            const state = stateRef.current;
            const container = containerRef.current;
            const sticker = stickerRef.current;
            const inner = innerRef.current;
            if (!container || !sticker || !inner) return;

            const rect = sticker.getBoundingClientRect();

            const grabOffsetX = touch.clientX - rect.left;
            const grabOffsetY = touch.clientY - rect.top;
            inner.style.transformOrigin = `${grabOffsetX}px ${grabOffsetY}px`;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = touch.clientX - centerX;
            const dy = touch.clientY - centerY;
            state.peelAngle = Math.atan2(dy, dx);

            state.dragStartX = touch.clientX;
            state.dragStartY = touch.clientY;
            state.dragOrigX = currentPos.x;
            state.dragOrigY = currentPos.y;

            state.peel = 0;
            state.lift = 0;

            state.held = true;
            state.peeling = true;
            state.sticking = false;

            state.lastMoveX = touch.clientX;
            state.lastMoveY = touch.clientY;
            state.lastMoveT = performance.now();

            const topZ = getNextZIndex();
            setCurrentZIndex(topZ);
            if (onBringToFront) onBringToFront(id);

            ensureTickRunning();
        },
        [currentPos, ensureTickRunning, id, onBringToFront, onSelect]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (!touch) return;

            const state = stateRef.current;
            if (!state.held) return;

            const inner = innerRef.current;
            if (!inner) return;

            const newX = state.dragOrigX + (touch.clientX - state.dragStartX);
            const newY = state.dragOrigY + (touch.clientY - state.dragStartY);

            state.x = newX;
            state.y = newY;
            setCurrentPos({ x: newX, y: newY });

            const now = performance.now();
            const dt = Math.max(1, now - state.lastMoveT);
            const velX = ((touch.clientX - state.lastMoveX) / dt) * 16;
            const velY = ((touch.clientY - state.lastMoveY) / dt) * 16;
            state.lastMoveX = touch.clientX;
            state.lastMoveY = touch.clientY;
            state.lastMoveT = now;

            const targetTiltY = Math.max(-maxTilt, Math.min(maxTilt, velX * tiltSensitivity));
            const targetTiltX = Math.max(-maxTilt, Math.min(maxTilt, -velY * tiltSensitivity));

            state.dragTiltX += (targetTiltX - state.dragTiltX) * tiltSmoothing;
            state.dragTiltY += (targetTiltY - state.dragTiltY) * tiltSmoothing;

            state.currentTiltX = state.dragTiltX;
            state.currentTiltY = state.dragTiltY;

            if (sheenMode === "holo") {
                const tiltDelta =
                    Math.abs(state.dragTiltX - state.prevTiltX) +
                    Math.abs(state.dragTiltY - state.prevTiltY);
                state.holoMotion = Math.min(1, state.holoMotion + tiltDelta * HOLO_MOTION_BUMP);
                state.prevTiltX = state.dragTiltX;
                state.prevTiltY = state.dragTiltY;
            }

            inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`;
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            const state = stateRef.current;
            if (!state.held) return;

            const inner = innerRef.current;

            state.held = false;
            state.peeling = false;
            state.sticking = true;

            if (onPositionChange) {
                onPositionChange(id, state.x, state.y);
            }

            if (state.peel >= 0.95 && inner) {
                const rect = inner.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const dx = state.lastMoveX - centerX;
                const dy = state.lastMoveY - centerY;
                state.peelAngle = Math.atan2(-dy, -dx);
                state.peel = 1;
            }

            const settleTilt = () => {
                state.dragTiltX *= 0.9;
                state.dragTiltY *= 0.9;
                state.currentTiltX = state.dragTiltX;
                state.currentTiltY = state.dragTiltY;

                if (inner) {
                    inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`;
                }

                if (Math.abs(state.dragTiltX) > 0.1 || Math.abs(state.dragTiltY) > 0.1) {
                    requestAnimationFrame(settleTilt);
                } else {
                    state.dragTiltX = 0;
                    state.dragTiltY = 0;
                    state.currentTiltX = 0;
                    state.currentTiltY = 0;
                    state.prevTiltX = 0;
                    state.prevTiltY = 0;
                    if (inner) {
                        inner.style.transform = "";
                    }
                }
            };
            settleTilt();

            ensureTickRunning();
        };

        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd);

        return () => {
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isDragging, tiltSensitivity, tiltSmoothing, ensureTickRunning, sheenMode, maxTilt, id, onPositionChange]);

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            style={{
                position: "absolute",
                left: `${currentPos.x}px`,
                top: `${currentPos.y}px`,
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                zIndex: currentZIndex,
                perspective: "800px",
                touchAction: "none",
                ...style,
            }}
        >
            <div
                ref={stickerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    cursor: "grab",
                    userSelect: "none",
                    perspective: "800px",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div
                    ref={innerRef}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        overflow: "visible",
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "block",
                            pointerEvents: "none",
                            position: "absolute",
                        }}
                    />
                </div>
            </div>

            {/* Action Bar Floating Controls */}
            {(showControls || isSelected) && (
                <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-none px-3 py-1.5 text-white shadow-2xl z-50 transition-all duration-200"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => onEditDescription?.(id)}
                        className="p-1 hover:bg-white/10 rounded-none text-amber-300 hover:text-amber-200 transition-colors"
                        title="Chỉnh sửa mô tả"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onBringToFront?.(id)}
                        className="p-1 hover:bg-white/10 rounded-none text-cyan-300 hover:text-cyan-200 transition-colors"
                        title="Đưa lên trên cùng"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete?.(id)}
                        className="p-1 hover:bg-red-500/30 rounded-none text-red-400 hover:text-red-300 transition-colors"
                        title="Xóa sticker"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Desktop Width Controls: shrink & enlarge width freely */}
                    {onResizeWidth && (
                        <div className="flex items-center gap-1 border-l border-white/20 pl-2 ml-1">
                            <button
                                onClick={() => onResizeWidth(id, Math.max(140, Math.round(imageWidth - 40)))}
                                className="px-1.5 py-0.5 hover:bg-amber-500/20 rounded-none text-amber-300 hover:text-amber-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                                title="Thu nhỏ chiều rộng (-40px)"
                            >
                                -W
                            </button>
                            <span className="text-[10px] font-mono text-slate-300 min-w-[38px] text-center">
                                {imageWidth}px
                            </span>
                            <button
                                onClick={() => onResizeWidth(id, Math.min(1000, Math.round(imageWidth + 40)))}
                                className="px-1.5 py-0.5 hover:bg-amber-500/20 rounded-none text-amber-300 hover:text-amber-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                                title="Phóng lớn chiều rộng (+40px)"
                            >
                                +W
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Description Badge / Tape note */}
            {description && (
                <div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 max-w-[260px] truncate bg-amber-950/90 border border-amber-500/40 text-amber-100 text-xs px-3 py-1 rounded-none font-mono backdrop-blur-sm flex items-center gap-1.5 cursor-pointer hover:max-w-none hover:whitespace-normal hover:z-50 transition-all"
                    onClick={() => onEditDescription?.(id)}
                    title={description}
                >
                    <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{description}</span>
                </div>
            )}
        </div>
    );
}

StickerDrag.displayName = "Sticker Drag";
