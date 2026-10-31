import {
  BRIDGES,
  bridgeHeight,
  meadowProfile,
  pathInfo,
  riverCenter,
} from "./landscape.js";
import { visibleGroundBounds, chunkPlan } from "./view-distance.js";
import { filmShotAt } from "./cinematography.js";
import {
  bridgeModel,
  campfireModel,
  waysideModel,
  filmSet,
} from "./environment-models.js";
import * as T from "three";
import {
  DAY_LENGTH,
  daylight,
  terrain,
  elevation,
  treeAt,
  rockAt,
  hash,
  riverX,
  HOUSES,
  VILLAGES,
  BENCHES,
  SEALS,
  DUNGEON,
  maxHp,
} from "./core.js";
import {
  points,
  beam,
  knightModel,
  animateKnight,
  treeModel,
  houseModel,
  ruinModel,
  benchModel,
  dragonModel,
  villagerModel,
  roomModel,
} from "./glyph-models.js";

const vertex = `
attribute float jitter;attribute vec3 tint;attribute float plant;
uniform float clock;uniform float daylight;uniform float glyphSize;uniform float family;uniform float emission;uniform float mode;uniform float motion;uniform float cycle;uniform float reflected;uniform vec3 baseColor;uniform vec3 focus;uniform vec3 lamps[8];
varying vec3 vColor;varying float vGlyph;varying float vFacing;varying vec3 vWorld;
void main(){
  vec4 world=modelMatrix*vec4(position,1.);vec3 n=normalize(mat3(modelMatrix)*normal);
  if(mode==1.){vec2 diff=world.xz-focus.xz;float push=1.-smoothstep(.15,1.35,length(diff));float wind=sin(clock*1.7+world.z*.65)+sin(clock*.8+world.x*.9)*.5;world.xz+=normalize(diff+vec2(.001))*push*plant*.85;world.y-=push*plant*.52;world.x+=wind*plant*plant*.18*motion;world.z+=cos(clock*1.2+world.x*.5)*plant*.09*motion;}
  if(mode==3.){world.x+=sin(clock*.8+world.z*.4)*.06*motion;}
  if(mode==5.){world.y+=sin(clock*1.3+jitter*40.)*.25;world.x+=sin(clock*.7+jitter*30.)*.2;}if(mode==7.)world.y=mod(world.y-clock*12.,17.);if(mode==4.){vec2 diff=world.xz-focus.xz;world.xz+=normalize(diff+vec2(.001))*(1.-smoothstep(.3,1.5,length(diff)))*.3;}
  if(mode==8.){world.x+=sin(clock*4.+position.y*6.+jitter*12.)*.06;world.y+=sin(clock*7.+jitter*10.)*.055;}if(mode==9.){world.y+=mod(clock*.65+jitter*3.,3.);world.x+=sin(clock+jitter*80.)*.18;}
  vec3 sun=normalize(vec3(-.6,1.,.35));float directional=max(0.,dot(n,sun));float illumination=.29+daylight*(.28+directional*.65);
  vec3 color=baseColor*tint;vec3 glow=vec3(0.);for(int i=0;i<8;i++){float lamp=pow(max(0.,1.-distance(world.xyz,lamps[i])/6.),2.);glow+=vec3(1.,.78,.34)*lamp*(1.-daylight)*1.9;}
  float waterWave=sin(world.z*3.8+world.x*2.1-clock*2.4)*.055+cos(world.x*6.2-world.z*1.7+clock*1.8)*.028;
  if(reflected>.5){world.x+=sin(world.z*3.8-clock*2.4)*.085*motion;world.z+=cos(world.x*6.2+clock*1.8)*.055*motion;}
  if(mode==2.){float rx=94.+sin(world.z/22.)*7.+sin(world.z/49.)*9.;float bank=abs(world.x-rx);float dist=length(world.xz-focus.xz);float ripples=sin(dist*12.-clock*5.)*exp(-dist*.42)*.055;world.y+=(waterWave+ripples)*motion;
    float clouds=smoothstep(.6,1.55,sin(world.x*.43+clock*.03)+cos(world.z*.31-clock*.055)+sin(world.z*.12+world.x*.2)*.3);
    float moon=exp(-pow((world.x-rx)*1.1+waterWave*4.,2.))*exp(-pow((world.z-focus.z-5.)*.22,2.));
    float shimmer=pow(max(0.,sin(world.z*19.-clock*2.+world.x*5.)),12.);float foam=smoothstep(2.65,3.2,bank)*(.5+.5*sin(world.z*9.-clock*3.));
    color=mix(vec3(.25,.48,.55),vec3(.86,.95,.95),clouds*daylight*.65+moon*(1.-daylight)*.95);color+=vec3(.55,.7,.68)*(shimmer*.65+foam*.85);illumination=.65+daylight*.35;
  }
  color=color*illumination+glow*.46+baseColor*emission*(.25+(1.-daylight)*.9);color*=.82+jitter*.32;
  vWorld=world.xyz;vFacing=mode==1.||mode==2.?1.:dot(n,normalize(cameraPosition-world.xyz));
  float rate=mode==2.?13.:mode==1.?7.:mode==3.?9.:6.;vGlyph=family+mod(floor(jitter*8.)+floor(clock*rate)*cycle,8.);
  if(mode==5.)color*=.6+sin(clock*1.8+jitter*80.)*.4;vColor=color;vec4 mv=viewMatrix*world;float fog=1.-smoothstep(85.,190.,-mv.z);vColor*=fog;
  gl_Position=projectionMatrix*mv;gl_PointSize=glyphSize*(mode==2.?1.35:1.)*clamp(25./max(1.,-mv.z),.65,1.2);
}`;
const fragment = `
uniform sampler2D atlas;uniform float reflected;uniform float sceneArea;uniform vec3 focus;uniform float mode;
varying vec3 vColor;varying float vGlyph;varying float vFacing;varying vec3 vWorld;
void main(){
  if(vFacing<-.03)discard;
  if(reflected>.5){vec3 ray=vWorld-cameraPosition;float f=(-.25-cameraPosition.y)/ray.y;vec3 hit=cameraPosition+ray*f;float rx=94.+sin(hit.z/22.)*7.+sin(hit.z/49.)*9.;if(sceneArea<.5&&abs(hit.x-rx)>3.15)discard;if(sceneArea>1.5)discard;}
  if(mode==3.){float fade=(1.-smoothstep(2.,4.,abs(vWorld.x-focus.x)))*smoothstep(-1.,1.,vWorld.z-focus.z)*(1.-smoothstep(9.,14.,vWorld.z-focus.z));if(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5)<fade*.91)discard;}
  vec2 tile=vec2(mod(vGlyph,16.),floor(vGlyph/16.));vec2 uv=vec2((tile.x+gl_PointCoord.x)/16.,1.-(tile.y+gl_PointCoord.y)/4.);float ink=texture2D(atlas,uv).r;if(ink<.25)discard;
  vec3 col=vColor;if(reflected>.5)col=mix(col,vec3(.16,.3,.37),.5)*.64;
  gl_FragColor=vec4(col*ink,1.);
}`;
function atlasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const c = canvas.getContext("2d");
  c.fillStyle = "#000";
  c.fillRect(0, 0, 256, 64);
  c.fillStyle = "#fff";
  c.font = "bold 14px Courier New";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const chars =
    "/|\\v,`'!d0Q8oPba0O8#%MWx|/\\=+[]:~-=,._~:*+x.*+:. .:;ox,-|!:/\\[]8";
  for (let i = 0; i < 64; i++)
    c.fillText(chars[i] || "#", (i % 16) * 16 + 8, Math.floor(i / 16) * 16 + 8);
  const tex = new T.CanvasTexture(canvas);
  tex.minFilter = T.NearestFilter;
  tex.magFilter = T.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

export class Renderer {
  constructor(canvas, world) {
    this.canvas = canvas;
    this.world = world;
    this.camera = { x: world.player.x, y: world.player.y };
    this.zoom = 1.1;
    this.motion = true;
    this.cycle = true;
    this.currentMode = "";
    this.chunks = new Map();
    this.actors = new Map();
    this.props = new Map();
    this.fx = new Map();
    this.materials = new Map();
    this.reflections = [];
    this.gl = new T.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    this.gl.setPixelRatio(this.pixelRatio);
    this.gl.outputColorSpace = T.LinearSRGBColorSpace;
    this.scene = new T.Scene();
    this.scene.background = new T.Color("#080e16");
    this.viewCamera = new T.PerspectiveCamera(43, 1, 0.1, 240);
    this.atlas = atlasTexture();
    this.shared = {
      clock: { value: 0 },
      daylight: { value: 1 },
      glyphSize: { value: 7.5 * this.pixelRatio },
      motion: { value: 1 },
      cycle: { value: 1 },
      focus: { value: new T.Vector3() },
      lamps: {
        value: Array.from({ length: 8 }, () => new T.Vector3(-999, 0, -999)),
      },
      sceneArea: { value: 0 },
    };
    this.m = {};
    const defs = {
      grass: ["#a6bba0", 0, 0, 1],
      leaf: ["#b1c5ad", 8, 0, 3],
      bark: ["#9c9b88", 56, 0, 0],
      wood: ["#b4a181", 56, 0, 0],
      plaster: ["#c3c2af", 16, 0, 0],
      roof: ["#aca38f", 56, 0, 0],
      stone: ["#b4bec0", 16, 0, 0],
      darkStone: ["#859599", 16, 0, 0],
      moss: ["#879f80", 8, 0, 0],
      steel: ["#becdd2", 24, 0.06, 0],
      darkSteel: ["#80959e", 24, 0, 0],
      brightSteel: ["#e1e5d9", 24, 0.14, 0],
      gold: ["#d4c182", 24, 0.02, 0],
      cloth: ["#ab847d", 24, 0, 0],
      leather: ["#8c806e", 56, 0, 0],
      dark: ["#26373d", 24, 0, 0],
      window: ["#e8d6a0", 40, 0.7, 0],
      glow: ["#f1daa0", 40, 1.1, 0],
      water: ["#62848e", 32, 0, 2],
      flower: ["#d4bfcb", 40, 0.05, 0],
      bush: ["#9bb590", 8, 0, 4],
      dragon: ["#9baea7", 16, 0, 0],
      darkDragon: ["#657f80", 16, 0, 0],
      wing: ["#95a7a1", 24, 0, 0],
      skin: ["#c8b9a0", 48, 0, 0],
      firefly: ["#e2e2ab", 40, 1.2, 5],
      rain: ["#adc3cb", 24, 0.05, 7],
      ore: ["#9ad6d0", 40, 0.6, 6],
      cloud: ["#a1b5bd", 48, 0.2, 0],
      fire: ["#ffbb61", 40, 1.2, 8],
      ember: ["#e87d42", 40, 0.95, 8],
      spark: ["#e87d42", 40, 1.1, 9],
    };
    for (const [name, def] of Object.entries(defs))
      this.m[name] = this.makeMaterial(name, ...def);
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.labelRoot = document.createElement("div");
    this.labelRoot.className = "world-labels";
    canvas.parentElement.appendChild(this.labelRoot);
  }
  makeMaterial(
    name,
    color,
    family = 0,
    emission = 0,
    mode = 0,
    reflected = false,
  ) {
    const key = `${name}:${reflected}`;
    if (this.materials.has(key)) return this.materials.get(key);
    const mat = new T.ShaderMaterial({
      uniforms: {
        ...this.shared,
        atlas: { value: this.atlas },
        baseColor: { value: new T.Color(color) },
        family: { value: family },
        emission: { value: emission },
        mode: { value: mode },
        reflected: { value: reflected ? 1 : 0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      depthTest: true,
      depthWrite: mode !== 2,
      transparent: false,
      defaultAttributeValues: { tint: [1, 1, 1], plant: [0] },
    });
    mat.userData = { name, color, family, emission, mode };
    this.materials.set(key, mat);
    return mat;
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.gl.setSize(this.w, this.h, false);
    this.viewCamera.aspect = this.w / this.h;
    this.viewCamera.updateProjectionMatrix();
  }
  clear() {
    const disposed = new Set();
    this.scene.traverse((o) => {
      if (
        o.isPoints &&
        o.geometry.getAttribute("plant") &&
        !disposed.has(o.geometry)
      ) {
        disposed.add(o.geometry);
        o.geometry.dispose();
      }
    });
    this.scene.clear();
    this.chunks.clear();
    this.actors.clear();
    this.props.clear();
    this.fx.clear();
    this.reflections = [];
    this.creationRoot = null;
    this.cineRoot = null;
    this.dragon = null;
    this.dungeonDragon = null;
    this.avatarMirror = null;
    this.emberPoints = null;
    this.rod = null;
    this.fishingLine = null;
    this.bobber = null;
    this.ambientRoot = null;
    this.campRoot = null;
    this.campKey = null;
    this.filmId = null;
    this.swordTrail = null;
    this.trailSamples = [];
    this.viewPlanKey = null;
  }
  scatter(parent, data, mat) {
    const geo = new T.BufferGeometry(),
      pos = [],
      norm = [],
      rand = [],
      tint = [],
      plant = [];
    for (const p of data) {
      pos.push(p.x, p.y, p.z);
      norm.push(p.nx || 0, p.ny ?? 1, p.nz || 0);
      rand.push(p.r ?? hash(Math.floor(p.x * 100), Math.floor(p.z * 100)));
      tint.push(...(p.tint || [1, 1, 1]));
      plant.push(p.plant || 0);
    }
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(norm, 3));
    geo.setAttribute("jitter", new T.Float32BufferAttribute(rand, 1));
    geo.setAttribute("tint", new T.Float32BufferAttribute(tint, 3));
    geo.setAttribute("plant", new T.Float32BufferAttribute(plant, 1));
    geo.computeBoundingSphere();
    const cloud = new T.Points(geo, mat);
    parent.add(cloud);
    return cloud;
  }
  mirror(root) {
    const mirror = new T.Group(),
      clone = root.clone(true);
    clone.traverse((p) => {
      if (!p.isPoints) return;
      const d = p.material.userData;
      p.material = this.makeMaterial(
        d.name,
        d.color,
        d.family,
        d.emission,
        d.mode,
        true,
      );
    });
    mirror.scale.y = -1;
    mirror.position.y = -0.5;
    mirror.add(clone);
    this.scene.add(mirror);
    this.reflections.push({ root, mirror, clone });
    return mirror;
  }
  patch(cx, cz, area = "vale", small = false, lod = 0) {
    const group = new T.Group(),
      grass = [],
      water = [],
      flowers = [],
      ground = [],
      details = [],
      foliage = [];
    const step = small ? 0.23 : lod === 0 ? 0.22 : lod === 1 ? 0.42 : 0.8,
      startX = cx * 12,
      startZ = cz * 12;
    for (let z = startZ; z < startZ + 12; z += step)
      for (let x = startX; x < startX + 12; x += step) {
        const rx = Math.round(x),
          rz = Math.round(z),
          type = terrain(x, z, area),
          h = elevation(x, z, area),
          n = hash(Math.floor(x * 131), Math.floor(z * 131), 22);
        if (type === "water") {
          const bank = Math.abs(x - riverCenter(z));
          water.push({ x, y: -0.25, z, r: n });
          if (lod < 2)
            water.push({
              x: x + step * 0.5,
              y: -0.25,
              z: z + step * 0.5,
              r: 1 - n,
            });
          if (lod === 0 && bank > 2.7 && n > 0.56) {
            for (let k = 0; k < 6; k++)
              grass.push({
                x: x + (n - 0.5) * 0.08,
                y: -0.12 + k * 0.17,
                z,
                plant: k / 5,
                r: n,
                tint: [0.8, 0.9, 0.48],
              });
          }
          continue;
        }
        if (type === "wall" || type === "bridge") continue;
        const road = type === "path",
          mountain = type === "mountain";
        if (area === "vale" && Math.abs(x - riverCenter(z)) < 3.65 && lod < 2) {
          const side = Math.sign(x - riverCenter(z));
          for (let y = -0.3; y < h; y += 0.15)
            details.push({
              x: x - side * (h - y) * 0.12,
              y,
              z,
              r: n,
              tint: [0.55, 0.65, 0.51],
              nx: -side,
              ny: 0.3,
            });
        }
        ground.push({
          x,
          y: h + 0.015,
          z,
          r: n,
          tint: road
            ? [1.07, 0.95, 0.72]
            : mountain
              ? [0.69, 0.75, 0.75]
              : type === "stone"
                ? [0.85, 0.93, 0.92]
                : [0.38, 0.58, 0.36],
        });
        // Terrace faces and rocky mountain slopes fill the space between height contours.
        if (lod < 2) {
          const next = elevation(x + step, z, area),
            drop = h - next;
          if (Math.abs(drop) > 0.2)
            for (let y = Math.min(h, next); y < Math.max(h, next); y += 0.16)
              details.push({
                x: x + step * 0.5,
                y,
                z,
                r: n,
                tint: [0.6, 0.69, 0.55],
                nx: 1,
                ny: 0,
              });
        }
        if (road) {
          if (lod === 0) {
            const info = pathInfo(x, z),
              rut = Math.abs(info.distance - 0.58) < 0.1;
            if (n > 0.42)
              details.push({
                x: x + (n - 0.5) * 0.1,
                y: h + 0.045 + (rut ? -0.04 : n * 0.07),
                z,
                r: n,
                tint: rut ? [0.55, 0.54, 0.4] : [0.9, 0.91, 0.77],
              });
            if (n > 0.65 && !rut) {
              for (let k = 0; k < 7; k++) {
                const angle = (k * Math.PI) / 3;
                details.push({
                  x: x + Math.cos(angle) * 0.09,
                  y: h + 0.04 + Math.sin(k * 0.5) * 0.06,
                  z: z + Math.sin(angle) * 0.09,
                  r: n,
                  tint: [0.9, 0.92, 0.82],
                  nx: Math.cos(angle) * 0.5,
                  ny: 0.7,
                  nz: Math.sin(angle) * 0.5,
                });
              }
            }
            if (info.distance > info.width - 0.2 && n > 0.66)
              for (let k = 0; k < 9; k++) {
                const angle = k * Math.PI * 0.75;
                details.push({
                  x: x + Math.cos(angle) * 0.15,
                  y: h + 0.07 + (k % 3) * 0.065,
                  z: z + Math.sin(angle) * 0.15,
                  r: n,
                  tint: [0.8, 0.85, 0.76],
                  nx: Math.cos(angle) * 0.5,
                  ny: 0.6,
                  nz: Math.sin(angle) * 0.5,
                });
              }
          }
          continue;
        }
        if (mountain) {
          if (lod < 2 && n > 0.77)
            details.push({
              x,
              y: h + 0.13,
              z,
              r: n,
              tint: h > 22 ? [1.05, 1.12, 1.1] : [0.67, 0.77, 0.75],
            });
          continue;
        }
        if (type === "stone") continue;
        const profile = meadowProfile(x, z),
          j = (n - 0.5) * step * 0.95,
          jz =
            (hash(Math.floor(x * 139), Math.floor(z * 137), 91) - 0.5) *
            step *
            0.95,
          height = 0.3 + n * 0.32 + profile.tall * (0.35 + n * 0.55),
          stages = lod === 0 ? 5 : lod === 1 ? 3 : 1;
        for (let k = 1; k <= stages; k++) {
          const f = k / stages;
          grass.push({
            x: x + j + Math.sin(n * 30) * f * 0.06,
            y: h + height * f,
            z: z + jz,
            plant: f,
            r: n,
            tint: [
              0.55 + n * 0.35 + profile.field * 0.12,
              0.8 + n * 0.3,
              0.46 + n * 0.25,
            ],
          });
        }
        if (lod < 2 && n > 1 - profile.flower * 0.28) {
          const species = profile.species,
            colors = [
              [1.55, 0.7, 1.35],
              [1.65, 1.45, 0.5],
              [1.5, 1.5, 1.55],
              [0.85, 0.85, 1.75],
              [1.75, 0.85, 0.55],
            ],
            heightF = 0.35 + n * 0.45;
          for (let k = 1; k <= 3; k++)
            grass.push({
              x,
              y: h + (heightF * k) / 3,
              z,
              plant: k / 3,
              r: n,
              tint: [0.5, 0.9, 0.4],
            });
          for (let k = 0; k < (lod === 0 ? 6 : 3); k++) {
            const angle = (k * Math.PI) / 3;
            flowers.push({
              x: x + Math.cos(angle) * 0.08,
              y: h + heightF + Math.sin(k * 1.3) * 0.025,
              z: z + Math.sin(angle) * 0.08,
              plant: 0.65,
              r: n,
              tint: colors[species],
            });
          }
          flowers.push({
            x,
            y: h + heightF + 0.035,
            z,
            r: n,
            tint: [1.8, 1.5, 0.6],
          });
        }
      }
    this.scatter(group, ground, this.m.stone);
    this.scatter(group, details, this.m.stone);
    this.scatter(group, grass, this.m.grass);
    this.scatter(group, water, this.m.water);
    this.scatter(group, flowers, this.m.flower);
    for (let z = startZ; z < startZ + 12; z++)
      for (let x = startX; x < startX + 12; x++) {
        const h = elevation(x, z, area),
          type = terrain(x, z, area);
        if (treeAt(x, z, area)) {
          if (lod < 2) {
            const tree = treeModel(this.m, Math.floor(hash(x, z, 11) * 3));
            tree.position.set(x, h, z);
            tree.userData.resource = area + ":tree:" + x + ":" + z;
            group.add(tree);
            if (Math.abs(x - riverCenter(z)) < 8) {
              const mirror = this.mirror(tree);
              mirror.userData.chunk = group;
              mirror.userData.resource = tree.userData.resource;
            }
          } else {
            for (let k = 0; k < 110; k++) {
              const n = hash(x * 111 + k, z),
                u = hash(k, z, 43),
                angle = n * 6.283,
                r = Math.sqrt(u) * 1.8;
              foliage.push({
                x: x + Math.cos(angle) * r,
                y: h + 3.2 + hash(k, x, 41) * 2.8,
                z: z + Math.sin(angle) * r,
                r: n,
                tint: [0.7, 0.9, 0.65],
              });
            }
          }
        } else if (rockAt(x, z, area) && lod < 2) {
          const rock = new T.Group();
          points(
            rock,
            this.m.stone,
            "ellipsoid",
            [0, 0.3, 0],
            [0.55, 0.4, 0.45],
            [0, 0, 0],
            0.14,
          );
          points(
            rock,
            this.m.ore,
            "ellipsoid",
            [0.25, 0.4, 0.3],
            [0.06, 0.1, 0.035],
            [0, 0, 0],
            0.035,
          );
          rock.position.set(x, h, z);
          rock.userData.resource = area + ":rock:" + x + ":" + z;
          group.add(rock);
        } else if (
          lod === 0 &&
          hash(x, z, 65) > 0.965 &&
          !["water", "path", "bridge", "mountain"].includes(type)
        ) {
          const bush = new T.Group();
          for (let i = 0; i < 3; i++)
            points(
              bush,
              this.m.bush,
              "ellipsoid",
              [Math.sin(i * 2) * 0.24, 0.4, Math.cos(i * 2) * 0.24],
              [0.4, 0.5, 0.4],
              [0, 0, 0],
              0.13,
            );
          bush.position.set(x, h, z);
          group.add(bush);
        }
        if (
          lod === 0 &&
          type !== "water" &&
          type !== "mountain" &&
          hash(x, z, 217) > 0.985
        ) {
          const info = pathInfo(x, z);
          if (
            info.distance > info.width + 0.5 &&
            info.distance < info.width + 1.5
          ) {
            const prop = waysideModel(this.m, hash(x, z, 88) > 0.65 ? 1 : 0);
            prop.position.set(x, h, z);
            prop.rotation.y = Math.atan2(info.tz, info.tx);
            group.add(prop);
          }
        }
      }
    this.scatter(group, foliage, this.m.leaf);
    this.scene.add(group);
    this.chunks.set(area + ":" + cx + ":" + cz, { group, cx, cz, area, lod });
    return group;
  }
  unloadChunk(k, ch) {
    this.scene.remove(ch.group);
    ch.group.traverse((o) => {
      if (o.isPoints && o.geometry.getAttribute("plant")) o.geometry.dispose();
    });
    this.reflections = this.reflections.filter((r) => {
      if (r.mirror.userData.chunk !== ch.group) return true;
      this.scene.remove(r.mirror);
      return false;
    });
    this.chunks.delete(k);
  }
  loadArea(px, pz, area) {
    const plan = chunkPlan(
        visibleGroundBounds(this.viewCamera, { x: px, z: pz }),
        { x: px, z: pz },
        area,
      ),
      key = plan.map((c) => c.key + ":" + c.lod).join("|");
    if (this.viewPlanKey === key) return;
    this.viewPlanKey = key;
    const wanted = new Map(plan.map((c) => [c.key, c]));
    for (const [k, ch] of this.chunks)
      if (!wanted.has(k) || wanted.get(k).lod !== ch.lod)
        this.unloadChunk(k, ch);
    for (const c of plan)
      if (!this.chunks.has(c.key)) this.patch(c.x, c.z, area, false, c.lod);
  }
  landmarks() {
    if (this.world.player.area === "vale")
      for (const b of BRIDGES) {
        const bridge = bridgeModel(this.m, b);
        bridge.position.set(b.x, bridgeHeight(b), b.z);
        this.scene.add(bridge);
        this.mirror(bridge);
        this.props.set(b.id, bridge);
      }
    if (this.world.player.area === "isle") {
      const temple = ruinModel(this.m);
      temple.position.set(66, elevation(66, 48, "isle"), 48);
      this.scene.add(temple);
      const bench = benchModel(this.m);
      bench.position.set(46, elevation(46, 75, "isle"), 75);
      this.scene.add(bench);
      return;
    }
    for (const [x, z] of HOUSES) {
      const root = houseModel(this.m);
      root.position.set(x, elevation(x, z), z);
      this.scene.add(root);
      this.props.set(`house:${x}`, root);
    }
    for (const village of VILLAGES)
      for (let i = 0; i < 4; i++) {
        const x = village.x + [-4, 5, -6, 6][i],
          z = village.y + [-2, 5, 6, -4][i],
          prop = waysideModel(this.m, [1, 2, 0, 3][i]);
        prop.position.set(x, elevation(x, z), z);
        prop.rotation.y = i % 2 ? Math.PI / 3 : 0;
        this.scene.add(prop);
      }
    for (const b of BENCHES) {
      const root = benchModel(this.m);
      root.position.set(b.x, elevation(b.x, b.y), b.y);
      this.scene.add(root);
      this.props.set(b.id, root);
    }
    for (const s of SEALS) {
      const root = ruinModel(this.m);
      root.position.set(s.x, elevation(s.x, s.y), s.y);
      this.scene.add(root);
      this.props.set(s.id, root);
    }
    const gate = ruinModel(this.m);
    gate.scale.setScalar(1.4);
    gate.position.set(DUNGEON.x, elevation(DUNGEON.x, DUNGEON.y), DUNGEON.y);
    this.scene.add(gate);
    this.props.set("dungeon", gate);
    for (let i = 0; i < VILLAGES.length; i++) {
      const v = VILLAGES[i];
      for (const side of [-1, 1]) {
        const root = new T.Group();
        points(root, this.m.wood, "cylinder", [0, 1, 0], [0.035, 2, 0.035]);
        points(
          root,
          this.m.darkSteel,
          "box",
          [0, 2.05, 0],
          [0.25, 0.35, 0.25],
          [0, 0, 0],
          0.05,
        );
        points(
          root,
          this.m.glow,
          "ellipsoid",
          [0, 2.05, 0],
          [0.13, 0.16, 0.13],
          [0, 0, 0],
          0.05,
        );
        root.position.set(
          v.x + side * 5,
          elevation(v.x + side * 5, v.y + 2),
          v.y + 2,
        );
        this.scene.add(root);
      }
    }
    const well = new T.Group();
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI) / 7;
      points(
        well,
        this.m.stone,
        "box",
        [Math.sin(a) * 0.65, 0.4, Math.cos(a) * 0.65],
        [0.27, 0.8, 0.2],
        [0, a, 0],
        0.1,
      );
    }
    well.position.set(48, elevation(48, 68), 68);
    this.scene.add(well);
  }
  createScene() {
    this.clear();
    const group = new T.Group();
    this.creationRoot = group;
    this.scene.add(group);
    const tree = treeModel(this.m, 2);
    tree.scale.setScalar(1.12);
    tree.position.set(-1.25, 0, -0.8);
    group.add(tree);
    const knight = knightModel(this.m);
    knight.position.set(0.15, 0, 0.3);
    group.add(knight);
    this.avatar = knight;
    this.viewCamera.fov = 43;
    this.viewCamera.updateProjectionMatrix();
    const data = [],
      flowers = [];
    for (let z = -6; z < 6; z += 0.24)
      for (let x = -8; x < 7; x += 0.24) {
        const n = hash(Math.floor(x * 100), Math.floor(z * 100), 53),
          height = n * 0.45;
        for (let k = 0; k < 3; k++)
          data.push({
            x,
            y: (k / 3) * height,
            z,
            r: n,
            plant: k / 3,
            tint: [0.7 + n * 0.4, 1, 0.73],
          });
        if (n > 0.94)
          flowers.push({
            x,
            y: 0.4,
            z,
            r: n,
            tint: n > 0.97 ? [1.3, 0.9, 1.2] : [1.4, 1.3, 0.9],
          });
      }
    this.scatter(group, data, this.m.grass);
    this.scatter(group, flowers, this.m.flower);
    this.shared.focus.value.set(100, 0, 100);
  }
  npcModel(princess = false) {
    return villagerModel(this.m, princess);
  }
  mobModel(type) {
    const g = knightModel(this.m);
    g.traverse((o) => {
      if (
        o.isPoints &&
        ["steel", "brightSteel"].includes(o.material.userData.name)
      )
        o.material =
          type === "boss"
            ? this.m.darkDragon
            : type === "skeleton"
              ? this.m.plaster
              : this.m.darkSteel;
    });
    if (type === "boss") g.scale.setScalar(1.35);
    return g;
  }
  updateEntities(dt) {
    const p = this.world.player,
      time = this.world.time,
      objects = [
        { id: "knight", ...p, player: true },
        ...this.world
          .activeMobs()
          .filter((m) => !m.dead)
          .map((m) => ({ ...m, mob: true })),
      ];
    if (p.area === "vale")
      objects.push(
        ...this.world.npcs.map((n) => ({ ...n, id: n.name, npc: true })),
      );
    if (p.area === "isle")
      objects.push({ id: "Elara", x: 66, y: 51, npc: true, princess: true });
    const present = new Set();
    for (const o of objects) {
      if (Math.hypot(o.x - p.x, o.y - p.y) > 34) continue;
      present.add(o.id);
      let g = this.actors.get(o.id);
      if (!g) {
        g = o.player
          ? knightModel(this.m)
          : o.mob
            ? this.mobModel(o.type)
            : this.npcModel(o.princess);
        this.scene.add(g);
        this.actors.set(o.id, g);
        if (o.player) {
          this.avatar = g;
          this.avatarMirror = this.mirror(g);
        }
      }
      g.position.set(
        o.player && p.restBench ? p.restBench.x : o.x,
        elevation(o.x, o.y, p.area) + (o.player && p.mounted ? 0.85 : 0),
        o.player && p.restBench ? p.restBench.y : o.y,
      );
      if (o.player)
        animateKnight(
          g,
          p,
          time,
          this.motion,
          this.world.cinematic?.id === "rest",
        );
      else if (o.mob) {
        const attacking = time - o.anim < 0.5;
        animateKnight(
          g,
          {
            hp: o.hp,
            anim: attacking
              ? { kind: "slash1", start: o.anim, duration: 0.5 }
              : {},
            input: {},
            facing: { x: p.x - o.x, y: p.y - o.y },
          },
          time,
          this.motion,
        );
      } else {
        g.rotation.y = 0.1 + Math.sin(time * 0.5) * 0.04;
      }
    }
    for (const [id, g] of this.actors)
      if (!present.has(id)) {
        this.scene.remove(g);
        this.actors.delete(id);
      }
    if (p.story.dragon && p.mounted) {
      if (!this.dragon) {
        this.dragon = dragonModel(this.m);
        this.scene.add(this.dragon);
      }
      this.dragon.visible = true;
      this.dragon.position.set(p.x, elevation(p.x, p.y, p.area) + 0.1, p.y);
      this.dragon.rotation.y = Math.atan2(p.facing.x, p.facing.y);
      this.dragon.userData.left.rotation.z = Math.sin(time * 3) * 0.18;
      this.dragon.userData.right.rotation.z = -Math.sin(time * 3) * 0.18;
    } else if (this.dragon) this.dragon.visible = false;
    for (const r of this.reflections) {
      r.mirror.visible =
        !(
          this.world.depleted[r.mirror.userData.resource]?.until >
          this.world.time
        ) &&
        p.area === "vale" &&
        Math.abs(r.root.position.x - riverX(r.root.position.z)) < 10 &&
        !this.world.cinematic;
      if (r.mirror.visible) {
        r.clone.position.copy(r.root.position);
        r.clone.rotation.copy(r.root.rotation);
        r.clone.scale.copy(r.root.scale);
      }
    }
    if (this.avatarMirror && this.avatarMirror.visible) {
      const original = this.avatar,
        copy = this.avatarMirror.children[0];
      original.traverse((o) => {
        if (!o.isPoints && !o.isGroup) return;
      });
      const src = [],
        dst = [];
      original.traverse((o) => src.push(o));
      copy.traverse((o) => dst.push(o));
      src.forEach((o, i) => {
        if (dst[i]) {
          dst[i].position.copy(o.position);
          dst[i].rotation.copy(o.rotation);
          dst[i].visible = o.visible;
        }
      });
    }
  }
  updateObjects() {
    const p = this.world.player;
    for (const ch of this.chunks.values())
      ch.group.children.forEach((g) => {
        if (!g.userData.resource) return;
        g.visible = !(
          this.world.depleted[g.userData.resource]?.until > this.world.time
        );
        if (g.userData.leaves) {
          g.userData.leaves.rotation.y = this.motion
            ? Math.sin(this.world.time * 0.6 + g.position.x) * 0.016
            : 0;
        }
      });
    const active = new Set();
    if (p.area === "vale")
      for (const o of this.world.objects) {
        if (o.opened || Math.hypot(o.x - p.x, o.y - p.y) > 25) continue;
        active.add(o.id);
        if (!this.props.has(o.id)) {
          const g = new T.Group();
          points(g, this.m.wood, "box", [0, 0.25, 0], [0.85, 0.5, 0.55]);
          for (const x of [-0.25, 0.25])
            points(g, this.m.gold, "box", [x, 0.25, 0.29], [0.06, 0.5, 0.02]);
          g.position.set(o.x, elevation(o.x, o.y), o.y);
          this.scene.add(g);
          this.props.set(o.id, g);
        }
      }
    for (const [id, g] of this.props)
      if (id.startsWith("chest:")) g.visible = active.has(id);
    const ids = new Set();
    for (const e of this.world.effects) {
      ids.add(e.id);
      let g = this.fx.get(e.id);
      if (!g) {
        g = new T.Group();
        const data = [];
        for (let i = 0; i < 25; i++) {
          const a = (i * Math.PI * 2) / 25;
          data.push({
            x: Math.sin(a),
            y: Math.cos(a) * 0.2,
            z: Math.cos(a),
            r: hash(i, 1),
          });
        }
        this.scatter(g, data, e.kind === "heal" ? this.m.glow : this.m.gold);
        this.scene.add(g);
        this.fx.set(e.id, g);
      }
      const age = 1 - e.life / e.maxLife;
      g.position.set(e.x, elevation(e.x, e.y, p.area) + 0.8 + age * 0.6, e.y);
      g.scale.setScalar(0.2 + age * 1.3);
      g.rotation.y = age * 2;
      g.visible = e.area === p.area;
    }
    for (const [id, g] of this.fx)
      if (!ids.has(id)) {
        this.scene.remove(g);
        g.traverse((o) => {
          if (o.isPoints && o.geometry.getAttribute("plant"))
            o.geometry.dispose();
        });
        this.fx.delete(id);
      }
  }
  buildDungeon() {
    this.clear();
    this.dungeonRoot = new T.Group();
    this.scene.add(this.dungeonRoot);
    const data = [];
    for (let z = 1; z < 29; z += 0.27)
      for (let x = 1; x < 32; x += 0.27)
        data.push({
          x,
          y: 0,
          z,
          r: hash(Math.floor(x * 20), Math.floor(z * 20)),
          tint: [0.7, 0.8, 0.8],
        });
    this.scatter(this.dungeonRoot, data, this.m.stone);
    for (const x of [1.5, 30.5])
      for (let z = 2; z < 28; z += 2) {
        points(
          this.dungeonRoot,
          this.m.darkStone,
          "box",
          [x, 1.5, z],
          [0.4, 3, 1.8],
          [0, 0, 0],
          0.14,
        );
        if (z % 6 === 2)
          points(
            this.dungeonRoot,
            this.m.glow,
            "ellipsoid",
            [x, 1.8, z],
            [0.08, 0.13, 0.08],
          );
      }
    const gate = ruinModel(this.m);
    gate.position.set(16, 0, 3);
    this.dungeonRoot.add(gate);
  }
  buildRoom() {
    this.clear();
    this.room = roomModel(this.m);
    this.scene.add(this.room);
  }
  updateFishing() {
    const p = this.world.player;
    if (!this.avatar || this.currentMode !== "game") return;
    if (p.fishing) {
      if (!this.rod) {
        this.rod = new T.Group();
        beam(this.rod, this.m.leather, [0, 0, 0], [0, 2.1, 0], 0.025);
        this.rod.rotation.x = 0.7;
        this.rod.position.set(0, -0.45, 0.04);
      }
      if (this.rod.parent !== this.avatar.userData.limbs.rightElbow)
        this.avatar.userData.limbs.rightElbow.add(this.rod);
      this.rod.visible = true;
      if (this.fishingLine) {
        this.scene.remove(this.fishingLine);
        this.fishingLine.geometry.dispose();
      }
      this.avatar.updateMatrixWorld(true);
      const start = new T.Vector3(0, 2.1, 0).applyMatrix4(this.rod.matrixWorld),
        end = new T.Vector3(
          riverX(p.y) + (p.x < riverX(p.y) ? -1.5 : 1.5),
          -0.18,
          p.y + 0.8,
        );
      const data = [];
      for (let i = 0; i < 70; i++) {
        const f = i / 69;
        data.push({
          x: T.MathUtils.lerp(start.x, end.x, f),
          y: T.MathUtils.lerp(start.y, end.y, f) - Math.sin(f * Math.PI) * 0.25,
          z: T.MathUtils.lerp(start.z, end.z, f),
          r: 0.5,
        });
      }
      this.fishingLine = this.scatter(this.scene, data, this.m.plaster);
      if (!this.bobber) {
        this.bobber = new T.Group();
        points(
          this.bobber,
          this.m.glow,
          "ellipsoid",
          [0, 0, 0],
          [0.045, 0.08, 0.045],
          [0, 0, 0],
          0.03,
        );
        this.scene.add(this.bobber);
      }
      this.bobber.visible = true;
      this.bobber.position.copy(end);
      this.bobber.position.y +=
        Math.sin(this.world.time * 3) * (p.fishing.bite ? 0.09 : 0.025);
    } else {
      if (this.rod) this.rod.visible = false;
      if (this.bobber) this.bobber.visible = false;
      if (this.fishingLine) this.fishingLine.visible = false;
    }
  }
  updateAmbient() {
    const p = this.world.player;
    if (this.world.cinematic || this.currentMode !== "game") return;
    if (!this.ambientRoot) {
      this.ambientRoot = new T.Group();
      this.scene.add(this.ambientRoot);
      const rain = [],
        flies = [];
      for (let i = 0; i < 650; i++)
        rain.push({
          x: (hash(i, 3) - 0.5) * 42,
          y: hash(i, 4) * 17,
          z: (hash(i, 5) - 0.5) * 42,
          r: hash(i, 6),
        });
      for (let i = 0; i < 70; i++)
        flies.push({
          x: (hash(i, 13) - 0.5) * 32,
          y: 0.3 + hash(i, 14) * 2.3,
          z: (hash(i, 15) - 0.5) * 32,
          r: hash(i, 16),
        });
      this.rainPoints = this.scatter(this.ambientRoot, rain, this.m.rain);
      this.fireflies = this.scatter(this.ambientRoot, flies, this.m.firefly);
    }
    this.ambientRoot.position.set(p.x, 0, p.y);
    this.rainPoints.visible =
      this.motion &&
      this.world.weather !== "clear" &&
      p.area !== "dungeon" &&
      p.area !== "house";
    this.fireflies.visible =
      this.motion &&
      daylight(this.world.clock).night &&
      p.area !== "dungeon" &&
      p.area !== "house";
  }
  project(x, z, height = 3.2) {
    const v = new T.Vector3(
      x,
      elevation(x, z, this.world.player.area) + height,
      z,
    ).project(this.viewCamera);
    return {
      x: (v.x * 0.5 + 0.5) * this.w,
      y: (-0.5 * v.y + 0.5) * this.h,
      visible: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1,
    };
  }
  updateLabels() {
    if (this.currentMode !== "game" || this.world.cinematic) {
      this.labelRoot.innerHTML = "";
      return;
    }
    const p = this.world.player;
    const labels = [];
    const entities =
      p.area === "vale"
        ? this.world.npcs
        : p.area === "isle"
          ? [{ name: "Elara", x: 66, y: 51 }]
          : [];
    for (const e of entities) {
      if (Math.hypot(e.x - p.x, e.y - p.y) > 15) continue;
      const point = this.project(e.x, e.y);
      if (point.visible)
        labels.push(
          `<span style="left:${point.x}px;top:${point.y}px">${e.name}</span>`,
        );
    }
    for (const e of this.world.effects) {
      if (!e.text) continue;
      const point = this.project(e.x, e.y, 2.5 + (1 - e.life / e.maxLife));
      if (point.visible)
        labels.push(
          `<span style="left:${point.x}px;top:${point.y}px;color:#ddcaa9">${e.text}</span>`,
        );
    }
    this.labelRoot.innerHTML = labels.join("");
  }
  prologueFilm() {
    const cine = this.world.cinematic,
      shot = filmShotAt(cine.time),
      p = this.world.player;
    if (this.filmId !== shot.id) {
      this.clear();
      this.filmId = shot.id;
      this.cineId = "prologue";
      this.film = filmSet(this.m, shot.id, this.scatter.bind(this));
      this.scene.add(this.film.root);
    }
    this.shared.focus.value.set(99, 0, 99);
    this.shared.daylight.value = ["siege", "last-stand", "ashes"].includes(
      shot.id,
    )
      ? 0.23
      : 0.92;
    this.film.actors.forEach((a) => {
      if (a.role === "princess") return;
      const combat = shot.id === "last-stand",
        local = shot.local + (a.offset || 0),
        anim = combat
          ? {
              kind: "slash" + (Math.floor(local / 1.6) % 3),
              start: this.world.time - (local % 1.6),
              duration: 0.85,
            }
          : {};
      animateKnight(
        a.root,
        {
          ...p,
          hp: 1,
          input: {},
          mounted: false,
          fishing: null,
          camping: false,
          roll: null,
          block: 0,
          anim,
          facing: {
            x: a.role === "enemy" ? 0 : 0.25,
            y: a.role === "enemy" ? -1 : 1,
          },
        },
        this.world.time,
        this.motion,
        shot.id === "oath" || shot.id === "ashes",
      );
    });
    this.film.fires.forEach((f, i) =>
      f.userData.flame.scale.set(
        1 + Math.sin(cine.time * 7 + i) * 0.14,
        1 + Math.cos(cine.time * 9 + i) * 0.25,
        1,
      ),
    );
    this.viewCamera.fov = shot.fov;
    this.viewCamera.updateProjectionMatrix();
    this.viewCamera.position.set(...shot.camera);
    this.viewCamera.lookAt(...shot.target);
  }
  cinematic(dt) {
    const cine = this.world.cinematic,
      time = this.world.time,
      p = this.world.player;
    if (cine.id === "prologue") {
      this.prologueFilm();
      return;
    }
    if (cine.id === "rest") {
      this.game(dt, true);
      return;
    }
    if (this.cineId !== cine.id) {
      this.clear();
      this.cineId = cine.id;
      this.cineRoot = new T.Group();
      this.scene.add(this.cineRoot);
      this.cineKnight = knightModel(this.m);
      this.cineRoot.add(this.cineKnight);
      this.cineKnight.position.set(-2, 0, 2);
      if (cine.id === "dragon" || cine.id === "flight") {
        this.cineDragon = dragonModel(this.m);
        this.cineRoot.add(this.cineDragon);
        this.cineDragon.position.set(0, 0, 0);
        if (cine.id === "dragon") {
          const gate = ruinModel(this.m);
          gate.scale.setScalar(2);
          gate.position.set(0, 0, -4);
          this.cineRoot.add(gate);
        }
        if (cine.id === "flight") {
          this.flightClouds = [];
          for (let i = 0; i < 12; i++) {
            const cloud = new T.Group();
            for (let j = 0; j < 3; j++)
              points(
                cloud,
                this.m.cloud,
                "ellipsoid",
                [j * 1.1, 0, 0],
                [1.5, 0.3, 1.1],
                [0, 0, 0],
                0.2,
              );
            cloud.position.set(
              (hash(i, 2) - 0.5) * 36,
              -1.7 + hash(i, 3) * 4,
              (hash(i, 4) - 0.5) * 50,
            );
            cloud.userData.offset = cloud.position.z;
            this.flightClouds.push(cloud);
            this.cineRoot.add(cloud);
          }
          const landscape = [];
          for (let z = -35; z < 30; z += 0.4)
            for (let x = -27; x < 27; x += 0.4) {
              const river = Math.abs(x - Math.sin(z * 0.14) * 4) < 1.3;
              landscape.push({
                x,
                y: -7 + Math.sin(x * 0.2) * Math.cos(z * 0.15) * 1.3,
                z,
                r: hash(Math.floor(x * 10), Math.floor(z * 10)),
                tint: river ? [0.6, 1.2, 1.4] : [0.6, 0.9, 0.5],
              });
            }
          this.flightGround = new T.Group();
          this.scatter(this.flightGround, landscape, this.m.grass);
          this.cineRoot.add(this.flightGround);
        }
      }
      if (cine.id === "reunion") {
        const maiden = this.npcModel(true);
        maiden.position.set(1.2, 0, 0.1);
        this.cineRoot.add(maiden);
        this.cineKnight.position.set(-1.2, 0, 0.1);
        const grass = [];
        for (let i = 0; i < 2500; i++)
          grass.push({
            x: (hash(i, 2) - 0.5) * 20,
            y: hash(i, 3) * 0.25,
            z: (hash(i, 4) - 0.5) * 15,
            r: hash(i, 6),
            plant: 1,
          });
        this.scatter(this.cineRoot, grass, this.m.grass);
      }
    }
    this.shared.focus.value.set(99, 0, 99);
    const t = cine.time;
    animateKnight(
      this.cineKnight,
      { ...p, anim: {}, input: {}, hp: 1 },
      time,
      this.motion,
    );
    if (cine.id === "flight") {
      this.cineDragon.position.y = Math.sin(t * 1.7) * 0.18 + 1;
      this.cineDragon.userData.left.rotation.z = Math.sin(t * 4) * 0.65;
      this.cineDragon.userData.right.rotation.z = -Math.sin(t * 4) * 0.65;
      this.cineKnight.position.set(0, 1.2, -0.15);
      this.cineKnight.scale.setScalar(0.7);
      animateKnight(
        this.cineKnight,
        { ...p, anim: {}, input: {}, hp: 1, mounted: true },
        time,
        this.motion,
        true,
      );
      this.viewCamera.position.set(8 + Math.sin(t * 0.13) * 2, 6.5, 10);
      this.viewCamera.lookAt(0, 1.8, 0);
      this.flightClouds?.forEach((cloud) => {
        cloud.position.z = ((cloud.userData.offset + t * 2 + 30) % 60) - 30;
      });
      if (this.flightGround) this.flightGround.position.z = (t * 2) % 9;
    } else {
      this.viewCamera.position.set(
        10 + Math.sin(t * 0.1) * 2,
        7.8,
        cine.id === "prologue" ? 16 : 12,
      );
      this.viewCamera.lookAt(0, cine.id === "prologue" ? 2 : 1.4, -1.5);
    }
    if (this.emberPoints) this.emberPoints.position.y = (t * 0.35) % 2;
  }
  game(dt, rest = false) {
    const p = this.world.player;
    if (this.area !== p.area || this.currentMode !== "game" || this.cineId) {
      this.area = p.area;
      this.chunkKey = null;
      this.cineId = null;
      if (p.area === "dungeon") this.buildDungeon();
      else if (p.area === "house") {
        this.buildRoom();
      } else {
        this.clear();
        this.landmarks();
      }
    }
    this.currentMode = "game";
    if (this.viewCamera.fov !== 43) {
      this.viewCamera.fov = 43;
      this.viewCamera.updateProjectionMatrix();
    }
    this.camera.x = T.MathUtils.damp(this.camera.x, p.x, 7, dt);
    this.camera.y = T.MathUtils.damp(this.camera.y, p.y, 7, dt);
    const h = elevation(p.x, p.y, p.area),
      distance = 1 / this.zoom;
    this.viewCamera.position.set(
      this.camera.x + 3.5 * distance,
      h + 13.5 * distance,
      this.camera.y + 16.5 * distance,
    );
    this.viewCamera.lookAt(this.camera.x, h + 1, this.camera.y - 0.6);
    this.shared.focus.value.set(p.x, h, p.y);
    if (!["dungeon", "house"].includes(p.area)) this.loadArea(p.x, p.y, p.area);
    this.updateEntities(dt);
    this.updateObjects();
    this.updateSwordTrail();
    if (p.area === "dungeon" && this.world.dungeon.bossDefeated) {
      if (!this.dungeonDragon) {
        this.dungeonDragon = dragonModel(this.m);
        this.scene.add(this.dungeonDragon);
      }
      this.dungeonDragon.position.set(16, 0, 6);
    }
    this.shared.lamps.value.forEach((v, i) => {
      const village = VILLAGES[Math.floor(i / 2)];
      if (village && p.area === "vale")
        v.set(village.x + (i % 2 ? 5 : -5), 2, village.y + 2);
      else if (p.area === "house" && i < 2)
        v.set(i === 0 ? 8 : 12.45, 1.5, i === 0 ? 2 : 7);
      else if (p.area === "dungeon")
        v.set(i % 2 ? 29 : 3, 2, 5 + Math.floor(i / 2) * 6);
      else v.set(-999, 0, -999);
    });
    this.updateCamp();
  }
  updateCamp() {
    const camp = this.world.camp,
      p = this.world.player,
      key = camp ? camp.start + ":" + camp.area : null;
    if (this.campKey !== key) {
      if (this.campRoot) this.scene.remove(this.campRoot);
      this.campRoot = camp ? campfireModel(this.m) : null;
      this.campKey = key;
      if (this.campRoot) this.scene.add(this.campRoot);
    }
    if (!this.campRoot) return;
    const r = this.campRoot,
      remaining =
        camp.until === Infinity
          ? 1
          : Math.max(0, (camp.until - this.world.time) / 12);
    r.visible = camp.area === p.area;
    r.position.set(camp.x, elevation(camp.x, camp.y, camp.area), camp.y);
    r.userData.flame.scale.set(
      1 + Math.sin(this.world.time * 8) * 0.1,
      remaining * (1 + Math.sin(this.world.time * 11) * 0.2),
      1,
    );
    const lamp = this.shared.lamps.value[7];
    lamp.set(camp.x, elevation(camp.x, camp.y, camp.area) + 0.8, camp.y);
  }
  updateSwordTrail() {
    if (!this.avatar) return;
    const p = this.world.player,
      a = p.anim,
      phase = (this.world.time - a.start) / (a.duration || 1),
      active =
        (a.kind.startsWith("slash") || a.kind === "cleave") &&
        phase > 0.2 &&
        phase < 0.75;
    if (active) {
      this.avatar.updateMatrixWorld(true);
      this.trailSamples.push({
        tip: this.avatar.userData.weapon.localToWorld(
          new T.Vector3(0, 1.62, 0),
        ),
        base: this.avatar.userData.weapon.localToWorld(
          new T.Vector3(0, 0.5, 0),
        ),
        time: this.world.time,
      });
    }
    this.trailSamples = (this.trailSamples || []).filter(
      (s) => this.world.time - s.time < 0.14,
    );
    if (this.swordTrail) {
      this.scene.remove(this.swordTrail);
      this.swordTrail.geometry.dispose();
      this.swordTrail = null;
    }
    if (this.trailSamples.length < 2) return;
    const data = [];
    this.trailSamples.forEach((s) => {
      for (let k = 0; k < 8; k++) {
        const point = s.base.clone().lerp(s.tip, k / 8);
        data.push({
          x: point.x,
          y: point.y,
          z: point.z,
          tint: [0.6, 0.8, 1],
          r: k / 8,
        });
      }
    });
    this.swordTrail = this.scatter(this.scene, data, this.m.brightSteel);
  }
  draw(dt = 0.016, mode = "game") {
    const time = this.world.time,
      day = daylight(this.world.clock);
    this.shared.clock.value = time;
    this.shared.daylight.value = mode === "creation" ? 0.85 : day.light;
    this.shared.motion.value = this.motion ? 1 : 0;
    this.shared.cycle.value = this.cycle ? 1 : 0;
    this.shared.sceneArea.value =
      this.world.player.area === "vale"
        ? 0
        : this.world.player.area === "isle"
          ? 1
          : 2;
    if (mode === "creation") {
      if (this.currentMode !== "creation") {
        this.createScene();
        this.currentMode = "creation";
      }
      animateKnight(
        this.avatar,
        { ...this.world.player, anim: {}, input: {}, hp: 1 },
        time,
        this.motion,
        true,
      );
      const aspect = this.w / this.h;
      this.viewCamera.position.set(7.8, 4.7, 10);
      this.viewCamera.lookAt(0, 1.6, -0.2);
      this.viewCamera.setViewOffset(
        this.w,
        this.h,
        this.w * 0.17,
        0,
        this.w,
        this.h,
      );
    } else {
      this.viewCamera.clearViewOffset();
      if (this.world.cinematic) this.cinematic(dt);
      else this.game(dt);
    }
    this.updateFishing();
    this.updateAmbient();
    this.gl.render(this.scene, this.viewCamera);
    this.updateLabels();
  }
  dispose() {
    this.observer.disconnect();
    this.labelRoot.remove();
    this.materials.forEach((m) => m.dispose());
    this.atlas.dispose();
    this.gl.dispose();
  }
}
