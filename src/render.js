import * as T from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import {
  WORLD_SIZE,
  terrain,
  treeAt,
  rockAt,
  hash,
  groundHeight,
  HOUSES,
  RUINS,
  CLASSES,
  MOB_TYPES,
  riverX,
} from "./core.js";
import {
  geometry,
  material,
  part,
  character,
  animateCharacter,
  house,
  ruin,
  interior,
  enemyModel,
} from "./models.js";

const dummy = new T.Object3D();
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment = `
uniform sampler2D image;uniform sampler2D atlas;uniform vec2 grid;uniform float time;uniform float cycle;varying vec2 vUv;
float rnd(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 cell=floor(vUv*grid),center=(cell+.5)/grid,local=fract(vUv*grid);
  vec3 raw=texture2D(image,center).rgb;vec3 col=clamp(pow(max(raw,vec3(0.)),vec3(.42))*1.3,0.,1.);
  float lum=clamp((dot(col,vec3(.25,.59,.16))-.16)*1.35,0.,1.);
  float speed=col.b>col.r*1.2?17.:col.g>col.r*1.15?10.:7.;
  float tick=floor(time*speed)*cycle;
  float band=clamp(floor(pow(lum,.9)*8.),0.,7.);
  float variant=floor(rnd(cell+floor(tick)*vec2(.73,1.37))*4.);
  float glyph=band*4.+variant;
  vec2 tile=vec2(mod(glyph,8.),floor(glyph/8.));
  vec2 uv=vec2((tile.x+local.x)/8.,1.-(tile.y+1.-local.y)/4.);
  float ink=texture2D(atlas,uv).r;
  float edge=abs(lum-dot(pow(texture2D(image,center+vec2(1./grid.x,0.)).rgb,vec3(.66)),vec3(.25,.59,.16)));
  vec3 color=col*(1.12+edge*.7);float vignette=1.-smoothstep(.28,.8,length((vUv-.5)*vec2(1.,.8)))*.42;
  gl_FragColor=vec4((color*ink+col*.025)*vignette,1.);if(dot(raw,vec3(.33))<.008)gl_FragColor.rgb=vec3(.02745,.0392,.06275);
}`;

function glyphAtlas() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 128, 64);
  ctx.font = "bold 15px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  const chars = " .`'.,:;:;!i-~=+*oxv?%$&#MW@N8B0Q";
  for (let i = 0; i < 32; i++)
    ctx.fillText(chars[i] || "#", (i % 8) * 16 + 8, Math.floor(i / 8) * 16 + 8);
  const texture = new T.CanvasTexture(c);
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export class Renderer {
  constructor(canvas, world, { showcase = false } = {}) {
    this.canvas = canvas;
    this.world = world;
    this.showcase = showcase;
    this.motion = true;
    this.cycle = true;
    this.zoom = 1;
    this.cellSize = 3;
    this.cameraTarget = new T.Vector3(48, 0, 73);
    this.chunks = new Map();
    this.actors = new Map();
    this.loot = new Map();
    this.fx = new Map();
    this.dynamicTrees = [];
    this.gl = new T.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.gl.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.gl.outputColorSpace = T.SRGBColorSpace;
    this.gl.toneMapping = T.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.3;
    this.scene = new T.Scene();
    this.scene.background = new T.Color(showcase ? "#06080e" : "#0c1417");
    this.scene.fog = new T.FogExp2(
      showcase ? "#06080e" : "#17282b",
      showcase ? 0.025 : 0.024,
    );
    this.camera = new T.PerspectiveCamera(showcase ? 32 : 42, 1, 0.1, 130);
    this.scene.add(new T.HemisphereLight("#d1e4e2", "#324329", 2.1));
    const sun = new T.DirectionalLight("#ffdfb1", 2.8);
    sun.position.set(-14, 24, 10);
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.sun = sun;
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = T.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -25,
      right: 25,
      top: 25,
      bottom: -25,
      near: 1,
      far: 75,
    });
    sun.shadow.bias = -0.001;
    sun.shadow.normalBias = 0.04;
    this.rim = new T.DirectionalLight("#7eb4c9", 1.6);
    this.rim.position.set(12, 8, -15);
    this.scene.add(this.rim);
    this.target = new T.WebGLRenderTarget(400, 240, {
      minFilter: T.NearestFilter,
      magFilter: T.NearestFilter,
      depthBuffer: true,
    });
    this.post = new T.Scene();
    this.postCam = new T.Camera();
    this.ascii = new T.ShaderMaterial({
      uniforms: {
        image: { value: this.target.texture },
        atlas: { value: glyphAtlas() },
        grid: { value: new T.Vector2(400, 240) },
        time: { value: 0 },
        cycle: { value: 1 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      depthTest: false,
      depthWrite: false,
    });
    this.post.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.ascii));
    this.uniforms = {
      clock: { value: 0 },
      focus: { value: new T.Vector3(48, 0, 73) },
      feet: {
        value: Array.from({ length: 4 }, () => new T.Vector3(-999, 0, -999)),
      },
    };
    this.grassMat = material("#b2c68a");
    this.grassMat.side = T.DoubleSide;
    this.grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.clock = this.uniforms.clock;
      shader.uniforms.feet = this.uniforms.feet;
      shader.vertexShader =
        "uniform float clock;uniform vec3 feet[4];\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      vec3 center=instanceMatrix[3].xyz;float tip=position.y+.5;
      transformed.x+=sin(clock*1.7+center.x*.8+center.z)*tip*.15;
      for(int k=0;k<4;k++){vec2 diff=center.xz-feet[k].xz;float push=1.-smoothstep(.2,1.45,length(diff));transformed.xz+=normalize(diff+vec2(.001))*push*tip*.42/max(length(instanceMatrix[0].xyz),.03);transformed.y-=push*tip*.7;}
      `,
      );
    };
    this.bushMat = material("#91af6d");
    this.bushMat.onBeforeCompile = this.grassMat.onBeforeCompile;
    this.leafMat = material("#b0c28a");
    this.leafMat.onBeforeCompile = (shader) => {
      shader.uniforms.clock = this.uniforms.clock;
      shader.uniforms.focus = this.uniforms.focus;
      shader.vertexShader =
        "uniform float clock;uniform vec3 focus;varying float leafFade;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec3 center=instanceMatrix[3].xyz;
        leafFade=(1.-smoothstep(2.5,4.5,abs(center.x-focus.x)))*(1.-smoothstep(10.,15.,center.z-focus.z))*smoothstep(-2.,0.,center.z-focus.z);
        transformed*=1.-leafFade*.12;transformed.x+=sin(clock*.8+center.x+center.z)*.045;
      `,
      );
      shader.fragmentShader =
        "varying float leafFade;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `#include <dithering_fragment>
        if(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)<leafFade*.97)discard;
      `,
      );
    };
    this.waterMat = new T.ShaderMaterial({
      uniforms: { clock: this.uniforms.clock, reflect: { value: null } },
      transparent: true,
      vertexShader:
        `varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;p.y+=sin(p.x*2.+p.z*1.3+${"clock"}*1.4)*.025;gl_Position=projectionMatrix*viewMatrix*p;}`.replace(
          "varying vec3 world;",
          "uniform float clock;varying vec3 world;",
        ),
      fragmentShader: `uniform float clock;varying vec3 world;void main(){float wave=sin(world.z*8.+world.x*3.-clock*3.)*.5+.5;float sparkle=pow(max(0.,sin(world.z*15.+world.x*7.+clock)),25.);gl_FragColor=vec4(mix(vec3(.035,.16,.18),vec3(.21,.43,.45),wave*.4)+sparkle*.22,.94);}`,
      side: T.DoubleSide,
    });
    if (showcase) {
      this.cameraTarget.set(0, 1.3, 0);
      this.podium = new T.Group();
      part(
        this.podium,
        "cylinder",
        material("#2b303f"),
        [0, -0.12, 0],
        [1.6, 0.22, 1.6],
      );
      part(
        this.podium,
        "torus",
        material("#a8b8df", 0.55),
        [0, 0.01, 0],
        [1.5, 1.5, 1.5],
        [Math.PI / 2, 0, 0],
      );
      for (let i = 0; i < 24; i++)
        part(
          this.podium,
          "box",
          material("#7d86ac", 0.25),
          [
            Math.sin((i * Math.PI) / 12) * 1.42,
            0.012,
            Math.cos((i * Math.PI) / 12) * 1.42,
          ],
          [0.04, 0.03, 0.13],
          [0, (i * Math.PI) / 12, 0],
        );
      this.scene.add(this.podium);
    } else {
      this.buildWeather();
      this.loadChunks(48, 73);
      this.buildLandmarks();
      this.buildReflection();
    }
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.gl.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    const gw = Math.ceil(this.w / this.cellSize),
      gh = Math.ceil(this.h / (this.cellSize * 1.65));
    this.target.setSize(gw, gh);
    this.ascii.uniforms.grid.value.set(gw, gh);
  }
  setCharacter(kind, gender, tint) {
    if (this.avatar) {
      this.scene.remove(this.avatar);
      this.disposeGroup(this.avatar);
    }
    this.avatar = character(kind, gender, tint);
    this.scene.add(this.avatar);
  }
  instances(group, type, mat, items) {
    if (!items.length) return;
    const m = new T.InstancedMesh(geometry(type), mat, items.length);
    const color = new T.Color();
    for (let i = 0; i < items.length; i++) {
      const v = items[i];
      dummy.position.set(v.x, v.y, v.z);
      dummy.scale.set(v.sx ?? 1, v.sy ?? 1, v.sz ?? 1);
      dummy.rotation.set(v.rx || 0, v.ry || 0, v.rz || 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (v.color) m.setColorAt(i, color.set(v.color));
    }
    m.instanceMatrix.needsUpdate = true;
    group.add(m);
    return m;
  }
  loadChunks(px, py) {
    const cx = Math.floor(px / 16),
      cy = Math.floor(py / 16);
    for (let z = Math.max(0, cy - 2); z <= Math.min(47, cy + 2); z++)
      for (let x = Math.max(0, cx - 2); x <= Math.min(47, cx + 2); x++) {
        const k = `${x}:${z}`;
        if (!this.chunks.has(k)) this.makeChunk(x, z, k);
      }
    for (const [k, c] of this.chunks)
      if (Math.abs(c.x - cx) > 3 || Math.abs(c.z - cy) > 3) {
        this.scene.remove(c.group);
        this.disposeGroup(c.group);
        this.chunks.delete(k);
      }
  }
  makeChunk(cx, cz, key) {
    const group = new T.Group(),
      size = 16,
      geo = new T.PlaneGeometry(size, size, 32, 32);
    geo.rotateX(-Math.PI / 2);
    geo.translate(cx * size + 8, 0, cz * size + 8);
    const pos = geo.attributes.position,
      colors = [];
    const color = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        z = pos.getZ(i),
        t = terrain(Math.round(x), Math.round(z));
      pos.setY(i, t === "water" ? -0.72 : groundHeight(x, z));
      color.set(
        t === "path"
          ? "#8c8061"
          : t === "snow"
            ? "#929e9c"
            : t === "water"
              ? "#172e30"
              : t === "marsh"
                ? "#344c3e"
                : t === "ruins"
                  ? "#5d6556"
                  : "#3b4d2f",
      );
      color.multiplyScalar(
        0.75 + hash(Math.floor(x * 3), Math.floor(z * 3), 17) * 0.55,
      );
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new T.Mesh(
      geo,
      new T.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        flatShading: true,
      }),
    );
    ground.receiveShadow = true;
    group.add(ground);
    const grass = [],
      flowers = [],
      bushes = [],
      stones = [],
      trunks = [],
      crowns = [],
      water = [],
      trees = [],
      rocks = [];
    for (let z = cz * size; z < (cz + 1) * size; z++)
      for (let x = cx * size; x < (cx + 1) * size; x++) {
        const t = terrain(x, z),
          h = groundHeight(x, z);
        if (t === "water") {
          water.push({ x, y: -0.2, z, sx: 1.04, sy: 0.025, sz: 1.04 });
          continue;
        }
        if (t === "path") {
          for (let j = 0; j < 5; j++)
            stones.push({
              x: x + (hash(x * 5 + j, z) - 0.5) * 0.9,
              y: h + 0.025,
              z: z + (hash(x, z * 5 + j) - 0.5) * 0.9,
              sx: 0.13 + hash(x + j, z) * 0.17,
              sy: 0.07,
              sz: 0.11 + hash(z + j, x) * 0.15,
              ry: hash(j + x, z) * 3,
              color: j % 2 ? "#a3987c" : "#716b58",
            });
          continue;
        }
        for (let j = 0; j < 11; j++) {
          const dx = hash(x * 11 + j, z) - 0.5,
            dz = hash(x, z * 11 + j) - 0.5;
          grass.push({
            x: x + dx,
            y: h + 0.12,
            z: z + dz,
            sx: 0.025 + hash(j + x, z) * 0.03,
            sy: 0.15 + hash(x, j + z) * 0.35,
            sz: 0.025,
            rz: (hash(x + j, z) - 0.5) * 0.6,
            ry: hash(x, z + j) * 6,
            color:
              t === "snow"
                ? "#8eaa9a"
                : t === "marsh"
                  ? "#638569"
                  : ["#567e3b", "#859d55", "#405c37", "#76914c"][j % 4],
          });
        }
        if (hash(x, z, 22) > 0.76) {
          const palette = [
            "#be9be8",
            "#f0a3be",
            "#e8d079",
            "#e8e9cf",
            "#eb9b70",
            "#8cbbdf",
          ];
          const color = palette[Math.floor(hash(x, z, 43) * 6)];
          for (let petal = 0; petal < 5; petal++)
            flowers.push({
              x: x + 0.2 + Math.sin(petal * 1.256) * 0.09,
              y: h + 0.4,
              z: z - 0.2 + Math.cos(petal * 1.256) * 0.09,
              sx: 0.09,
              sy: 0.035,
              sz: 0.08,
              color,
            });
          flowers.push({
            x: x + 0.2,
            y: h + 0.42,
            z: z - 0.2,
            sx: 0.05,
            sy: 0.04,
            sz: 0.05,
            color: "#efd586",
          });
        }
        if (hash(x, z, 65) > 0.97 && !treeAt(x, z))
          for (let j = 0; j < 4; j++)
            bushes.push({
              x: x + Math.sin(j * 2) * 0.25,
              y: h + 0.26 + j * 0.06,
              z: z + Math.cos(j * 2) * 0.25,
              sx: 0.5,
              sy: 0.37,
              sz: 0.48,
              color: j % 2 ? "#6f8d4d" : "#a1b477",
            });
        if (hash(x, z, 9) > 0.9)
          stones.push({
            x,
            y: h + 0.06,
            z,
            sx: 0.2,
            sy: 0.12,
            sz: 0.2,
            ry: hash(x, z) * 6,
            color: "#6c7967",
          });
        if (rockAt(x, z)) rocks.push({ x, z, h });
        if (treeAt(x, z)) {
          const n = hash(x, z, 11),
            height = 4.5 + n * 3.5;
          const tree = {
            x,
            z,
            h,
            height,
            index: trunks.length,
            crownStart: crowns.length,
          };
          trees.push(tree);
          trunks.push({
            x,
            y: h + height * 0.38,
            z,
            sx: 0.19 + n * 0.12,
            sy: height * 0.76,
            sz: 0.19 + n * 0.12,
            color: "#695540",
          });
          for (let j = 0; j < 6; j++)
            crowns.push({
              x: x + Math.sin(j * 2.4) * 0.65,
              y: h + height * 0.65 + (j % 3) * 0.63,
              z: z + Math.cos(j * 2.4) * 0.65,
              sx: 1.1 + n * 0.7,
              sy: 1.1 + n * 0.45,
              sz: 1.2 + n * 0.65,
              ry: hash(j + x, z) * 6,
              color:
                t === "snow"
                  ? ["#9cafa6", "#839c93", "#bac9bb"][j % 3]
                  : t === "marsh"
                    ? ["#627d68", "#759a7a", "#4e7063"][j % 3]
                    : ["#6f8a4c", "#9ba869", "#526e43", "#819951"][j % 4],
            });
        }
      }
    this.instances(group, "ico", this.bushMat, bushes);
    this.instances(group, "box", this.grassMat, grass);
    this.instances(group, "ico", material("#fff"), flowers);
    this.instances(group, "ico", material("#fff"), stones);
    const trunkMesh = this.instances(
        group,
        "cylinder",
        material("#fff"),
        trunks,
      ),
      crownMesh = this.instances(group, "ico", this.leafMat, crowns);
    if (trunkMesh) trunkMesh.castShadow = true;
    if (crownMesh) crownMesh.castShadow = true;
    const rockItems = [];
    for (const r of rocks)
      for (let j = 0; j < 4; j++)
        rockItems.push({
          x: r.x + Math.sin(j * 2) * 0.3,
          y: r.h + 0.22 + j * 0.09,
          z: r.z + Math.cos(j * 2) * 0.3,
          sx: 0.5,
          sy: 0.35 + j * 0.07,
          sz: 0.55,
          ry: j,
          color: j === 0 && hash(r.x, r.z, 915) > 0.975 ? "#749cb3" : "#788179",
        });
    const rockMesh = this.instances(group, "ico", material("#fff"), rockItems);
    this.scene.add(group);
    this.chunks.set(key, {
      x: cx,
      z: cz,
      group,
      trees,
      trunks,
      crowns,
      trunkMesh,
      crownMesh,
      rocks,
      rockItems,
      rockMesh,
      lastRevision: "",
    });
  }
  updateResources() {
    const revision = JSON.stringify(this.world.depleted);
    for (const chunk of this.chunks.values()) {
      if (
        chunk.lastRevision === revision &&
        this.world.time < (chunk.nextRegrow || Infinity)
      )
        continue;
      chunk.lastRevision = revision;
      chunk.nextRegrow = Infinity;
      for (const tree of chunk.trees) {
        const state = this.world.depleted[`tree:${tree.x}:${tree.z}`],
          cut = state?.until > this.world.time;
        if (cut) chunk.nextRegrow = Math.min(chunk.nextRegrow, state.until);
        const items = [
          chunk.trunks[tree.index],
          ...chunk.crowns.slice(tree.crownStart, tree.crownStart + 6),
        ];
        items.forEach((v, i) => {
          dummy.position.set(v.x, cut && i === 0 ? tree.h + 0.12 : v.y, v.z);
          dummy.rotation.set(0, v.ry || 0, 0);
          dummy.scale.set(
            cut ? (i === 0 ? 0.24 : 0) : v.sx,
            cut ? (i === 0 ? 0.24 : 0) : v.sy,
            cut ? (i === 0 ? 0.24 : 0) : v.sz,
          );
          dummy.updateMatrix();
          (i === 0 ? chunk.trunkMesh : chunk.crownMesh).setMatrixAt(
            i === 0 ? tree.index : tree.crownStart + i - 1,
            dummy.matrix,
          );
        });
      }
      for (let i = 0; i < chunk.rocks.length; i++) {
        const r = chunk.rocks[i],
          state = this.world.depleted[`rock:${r.x}:${r.z}`],
          cut = state?.until > this.world.time;
        if (cut) chunk.nextRegrow = Math.min(chunk.nextRegrow, state.until);
        for (let j = 0; j < 4; j++) {
          const v = chunk.rockItems[i * 4 + j];
          dummy.position.set(v.x, v.y, v.z);
          dummy.rotation.set(0, v.ry, 0);
          dummy.scale.set(cut ? 0 : v.sx, cut ? 0 : v.sy, cut ? 0 : v.sz);
          dummy.updateMatrix();
          chunk.rockMesh.setMatrixAt(i * 4 + j, dummy.matrix);
        }
      }
      if (chunk.trunkMesh) chunk.trunkMesh.instanceMatrix.needsUpdate = true;
      if (chunk.crownMesh) chunk.crownMesh.instanceMatrix.needsUpdate = true;
      if (chunk.rockMesh) chunk.rockMesh.instanceMatrix.needsUpdate = true;
    }
  }
  buildLandmarks() {
    for (const [x, z, style] of HOUSES) {
      const g = house(style);
      g.position.set(x, groundHeight(x, z), z);
      this.scene.add(g);
    }
    for (let i = 0; i < RUINS.length; i++) {
      const [x, z] = RUINS[i],
        g = ruin(i);
      g.position.set(x, groundHeight(x, z), z);
      this.scene.add(g);
    }
    const well = new T.Group();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      part(
        well,
        "box",
        material("#8f9c90"),
        [Math.sin(a) * 0.7, 0.45, Math.cos(a) * 0.7],
        [0.36, 0.85, 0.25],
        [0, a, 0],
      );
    }
    part(
      well,
      "cylinder",
      material("#50868b", 0.2),
      [0, 0.3, 0],
      [0.61, 0.05, 0.61],
    );
    for (const x of [-0.9, 0.9])
      part(well, "box", material("#6b5941"), [x, 1.3, 0], [0.1, 2.6, 0.1]);
    part(
      well,
      "cylinder",
      material("#6b5941"),
      [0, 2.5, 0],
      [0.08, 2, 0.08],
      [0, 0, Math.PI / 2],
    );
    well.position.set(48, groundHeight(48, 68), 68);
    this.scene.add(well);
    for (const z of [70, 142, 330, 560]) {
      const bridge = new T.Group();
      for (let i = -5; i <= 5; i++)
        part(
          bridge,
          "box",
          material(i % 2 ? "#a6966c" : "#8f7d58"),
          [i * 0.78, -0.01, 0],
          [0.7, 0.14, 3.8],
        );
      for (const side of [-1, 1]) {
        for (let i = -5; i <= 5; i += 2)
          part(
            bridge,
            "box",
            material("#746a4d"),
            [i * 0.78, 0.7, side * 1.7],
            [0.13, 1.5, 0.13],
          );
        part(
          bridge,
          "box",
          material("#918460"),
          [0, 1.3, side * 1.7],
          [8.2, 0.1, 0.1],
        );
      }
      bridge.position.set(riverX(z), 0, z);
      this.scene.add(bridge);
    }
  }
  buildReflection() {
    const base = Reflector.ReflectorShader,
      shader = {
        uniforms: { ...base.uniforms, clock: { value: 0 } },
        vertexShader: base.vertexShader
          .replace(
            "uniform mat4 textureMatrix;",
            "uniform mat4 textureMatrix;varying vec3 worldPos;",
          )
          .replace(
            "vUv = textureMatrix * vec4( position, 1.0 );",
            "vUv = textureMatrix * vec4( position, 1.0 );worldPos=(modelMatrix*vec4(position,1.)).xyz;",
          ),
        fragmentShader: `uniform sampler2D tDiffuse;uniform float clock;varying vec4 vUv;varying vec3 worldPos;
      void main(){vec4 uv=vUv;uv.x+=sin(worldPos.z*3.+clock*1.7)*.0018*uv.w;uv.y+=sin(worldPos.x*4.-clock*1.2)*.0014*uv.w;vec3 reflection=texture2DProj(tDiffuse,uv).rgb;float wave=pow(sin(worldPos.x*7.+worldPos.z*12.-clock*3.)*.5+.5,18.);gl_FragColor=vec4(mix(vec3(.025,.13,.16),reflection,.7)+vec3(.04,.07,.075)*wave,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
      };
    this.water = new Reflector(new T.PlaneGeometry(WORLD_SIZE, WORLD_SIZE), {
      color: "#6c9198",
      textureWidth: 512,
      textureHeight: 512,
      clipBias: 0.003,
      multisample: 0,
      shader,
    });
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(WORLD_SIZE / 2, -0.49, WORLD_SIZE / 2);
    this.scene.add(this.water);
  }
  buildWeather() {
    const count = 1000,
      pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (hash(i, 1) - 0.5) * 55;
      pos[i * 3 + 1] = hash(i, 2) * 18;
      pos[i * 3 + 2] = (hash(i, 3) - 0.5) * 55;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    this.weatherPoints = new T.Points(
      geo,
      new T.PointsMaterial({
        color: "#9dc6c3",
        size: 0.08,
        transparent: true,
        opacity: 0.55,
      }),
    );
    this.weatherBase = pos.slice();
    this.scene.add(this.weatherPoints);
    const flies = [];
    for (let i = 0; i < 120; i++)
      flies.push(
        (hash(i, 2) - 0.5) * 45,
        hash(i, 3) * 3,
        (hash(i, 4) - 0.5) * 45,
      );
    const fg = new T.BufferGeometry();
    fg.setAttribute("position", new T.Float32BufferAttribute(flies, 3));
    this.flies = new T.Points(
      fg,
      new T.PointsMaterial({
        color: "#d0d9a0",
        size: 0.055,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.scene.add(this.flies);
  }
  updateEntities(p, time, dt) {
    const present = new Set(),
      entities = [
        ...this.world.players.values(),
        ...this.world.npcs.map((n) => ({
          ...n,
          id: `npc:${n.name}`,
          kind: "elf",
          gender: "female",
          npc: true,
          tint: 4,
          hp: 1,
        })),
        ...this.world.mobs
          .filter(
            (m) => !m.dead && m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) < 40,
          )
          .map((m) => ({ ...m, mob: true })),
      ];
    for (const e of entities) {
      if (Math.hypot(e.x - p.x, e.y - p.y) > 45) continue;
      present.add(e.id);
      let root = this.actors.get(e.id);
      if (!root) {
        if (e.mob && e.kind === 0) {
          root = new T.Group();
          part(
            root,
            "sphere",
            material("#78aa45"),
            [0, 0.5, 0],
            [0.7, 0.55, 0.65],
          );
          for (const s of [-1, 1])
            part(
              root,
              "sphere",
              material("#182718"),
              [s * 0.2, 0.6, 0.58],
              [0.08, 0.1, 0.04],
            );
          root.userData.slime = true;
        } else {
          root = e.mob
            ? enemyModel(e.kind)
            : character(e.kind, e.gender || "male", e.tint);
        }
        this.scene.add(root);
        this.actors.set(e.id, root);
      }
      if (!root.userData.positioned) {
        root.position.set(e.x, groundHeight(e.x, e.y), e.y);
        root.userData.positioned = true;
      } else {
        root.position.x = T.MathUtils.damp(root.position.x, e.x, 20, dt);
        root.position.z = T.MathUtils.damp(root.position.z, e.y, 20, dt);
        root.position.y = groundHeight(root.position.x, root.position.z);
      }
      if (root.userData.slime) {
        const bounce = this.motion ? Math.sin(time * 4 + e.x) * 0.1 : 0;
        root.scale.set(1 - bounce, 1 + bounce, 1 - bounce);
      } else animateCharacter(root, e, time, dt, this.motion);
    }
    for (const [id, root] of this.actors)
      if (!present.has(id)) {
        this.scene.remove(root);
        this.disposeGroup(root);
        this.actors.delete(id);
      }
    const lootIds = new Set();
    for (const o of this.world.objects) {
      if (o.opened || Math.hypot(o.x - p.x, o.y - p.y) > 38) continue;
      lootIds.add(o.id);
      if (!this.loot.has(o.id)) {
        const g = new T.Group();
        if (o.type === "chest") {
          part(g, "box", material("#8f5e30"), [0, 0.25, 0], [1, 0.5, 0.65]);
          part(
            g,
            "cylinder",
            material("#a4743e"),
            [0, 0.52, 0],
            [0.34, 1, 0.34],
            [0, 0, Math.PI / 2],
          );
          for (const x of [-0.35, 0.35])
            part(
              g,
              "box",
              material("#d8b76b"),
              [x, 0.28, 0.34],
              [0.06, 0.5, 0.04],
            );
          part(
            g,
            "box",
            material("#e0c57b", 0.4),
            [0, 0.37, 0.36],
            [0.13, 0.15, 0.05],
          );
        } else if (o.type === "shrine") {
          part(g, "box", material("#869d91"), [0, 0.25, 0], [1.3, 0.5, 1.3]);
          part(
            g,
            "cylinder",
            material("#8eada2"),
            [0, 1.1, 0],
            [0.36, 1.8, 0.36],
          );
          part(
            g,
            "ico",
            material("#86e0c4", 0.8),
            [0, 2.2, 0],
            [0.3, 0.45, 0.3],
          );
        } else
          part(
            g,
            "cylinder",
            material("#e0be65", 0.6),
            [0, 0.45, 0],
            [0.16, 0.04, 0.16],
            [Math.PI / 2, 0, 0],
          );
        g.position.set(o.x, groundHeight(o.x, o.y), o.y);
        this.scene.add(g);
        this.loot.set(o.id, g);
      }
    }
    for (const [id, g] of this.loot)
      if (!lootIds.has(id)) {
        this.scene.remove(g);
        this.disposeGroup(g);
        this.loot.delete(id);
      }
    this.updateEffects(time);
  }
  updateEffects(time) {
    const ids = new Set();
    for (const e of this.world.effects) {
      ids.add(e.id);
      let g = this.fx.get(e.id);
      if (!g) {
        g = new T.Group();
        const mat = new T.MeshBasicMaterial({
          color: e.color || "#b7c9e0",
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        });
        if (
          ["heal", "shield", "holy", "frost", "arcane", "nature"].includes(
            e.kind,
          )
        ) {
          for (let i = 0; i < 3; i++)
            part(
              g,
              "torus",
              mat,
              [0, 0.2 + i * 0.45, 0],
              [1, 1, 1],
              [Math.PI / 2, 0, 0],
            );
          for (let i = 0; i < 16; i++)
            part(
              g,
              "ico",
              mat,
              [Math.sin(i) * 1.7, 0.1 + hash(i, 2) * 2, Math.cos(i) * 1.7],
              [0.07, 0.07, 0.07],
            );
        } else if (e.kind === "fall" && e.resourceType === "tree") {
          part(
            g,
            "cylinder",
            material("#75593b"),
            [0, 2.4, 0],
            [0.22, 4.8, 0.22],
          );
          for (let i = 0; i < 4; i++)
            part(
              g,
              "ico",
              material(i % 2 ? "#718d50" : "#8ca365"),
              [Math.sin(i * 2) * 0.7, 4.1 + i * 0.35, Math.cos(i * 2) * 0.7],
              [1.3, 1.2, 1.4],
            );
        } else if (e.kind === "roots") {
          for (let i = 0; i < 7; i++) {
            const a = i * 0.9;
            const curve = new T.CatmullRomCurve3([
              new T.Vector3(Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8),
              new T.Vector3(Math.sin(a + 1) * 0.7, 0.7, Math.cos(a + 1) * 0.7),
              new T.Vector3(Math.sin(a + 2) * 0.6, 1.5, Math.cos(a + 2) * 0.6),
            ]);
            g.add(
              new T.Mesh(new T.TubeGeometry(curve, 12, 0.055, 4, false), mat),
            );
          }
        } else if (e.kind === "slash" || e.kind === "dash") {
          const arc = new T.Mesh(
            new T.TorusGeometry(1.6, 0.05, 5, 30, Math.PI * 1.25),
            mat,
          );
          arc.rotation.x = Math.PI / 2 - 0.3;
          arc.position.y = 1;
          g.add(arc);
        } else
          for (let i = 0; i < 14; i++)
            part(
              g,
              "ico",
              mat,
              [Math.sin(i) * 0.3, 0.2, Math.cos(i) * 0.3],
              [0.07, 0.09, 0.07],
            );
        this.scene.add(g);
        this.fx.set(e.id, g);
      }
      const age = 1 - e.life / (e.maxLife || 1.1);
      g.position.set(e.x, groundHeight(e.x, e.y), e.y);
      if (e.kind === "projectile") {
        g.position.x = T.MathUtils.lerp(e.x, e.tx, Math.min(1, age * 2));
        g.position.z = T.MathUtils.lerp(e.y, e.ty, Math.min(1, age * 2));
        g.position.y += 1.6;
      } else if (e.kind === "fall" && e.resourceType === "tree") {
        g.rotation.z = (-Math.min(1, age * 1.4) * Math.PI) / 2;
        g.scale.setScalar(Math.max(0, 1 - Math.max(0, age - 0.7) * 3.3));
      } else if (e.kind === "roots") {
        g.scale.setScalar(Math.min(1, age * 8));
        g.rotation.y = time * 0.3;
      } else {
        g.scale.setScalar(0.5 + age * (e.kind === "heal" ? 2 : 3));
        g.rotation.y = age * 2;
        g.position.y += age * 0.5;
      }
      g.traverse((m) => {
        if (m.isMesh && m.material.transparent)
          m.material.opacity = Math.max(0, 1 - age) * 0.85;
      });
    }
    for (const [id, g] of this.fx)
      if (!ids.has(id)) {
        this.scene.remove(g);
        this.disposeGroup(g);
        this.fx.delete(id);
      }
  }
  updateInterior(p, time, dt) {
    if (!Number.isInteger(p.inside)) {
      this.activeScene = null;
      return;
    }
    const [x, z, style] = HOUSES[p.inside],
      height = groundHeight(x, z);
    if (this.roomId !== p.inside) {
      if (this.roomScene) this.disposeGroup(this.roomScene);
      this.roomScene = new T.Scene();
      this.roomScene.background = new T.Color("#060a10");
      this.roomScene.add(new T.HemisphereLight("#c9d9e2", "#594a31", 2.1));
      const light = new T.DirectionalLight("#b7cbd4", 3);
      light.position.set(x - 5, 10, z + 5);
      this.roomScene.add(light);
      this.room = interior(style);
      this.room.position.set(x, height, z);
      this.roomScene.add(this.room);
      this.roomId = p.inside;
      this.roomActors = new Map();
    }
    this.activeScene = this.roomScene;
    this.camera.position.set(x, height + 9.3, z + 10.4);
    this.camera.lookAt(x, height + 0.7, z - 0.4);
    this.room.userData.fire.intensity =
      17 + (this.motion ? Math.sin(time * 8) * 2 : 0);
    const ids = new Set();
    for (const a of this.world.players.values()) {
      if (a.inside !== p.inside) continue;
      ids.add(a.id);
      let mesh = this.roomActors.get(a.id);
      if (!mesh) {
        mesh = character(a.kind, a.gender, a.tint);
        this.roomScene.add(mesh);
        this.roomActors.set(a.id, mesh);
      }
      mesh.position.set(a.x, height, a.y);
      animateCharacter(mesh, a, time, dt, this.motion);
    }
    for (const [id, mesh] of this.roomActors)
      if (!ids.has(id)) {
        this.roomScene.remove(mesh);
        this.disposeGroup(mesh);
        this.roomActors.delete(id);
      }
  }
  draw(player, dt = 0.016) {
    const time = this.world.time;
    this.uniforms.clock.value = this.motion ? time : 0;
    this.ascii.uniforms.time.value = time;
    this.ascii.uniforms.cycle.value = this.cycle ? 1 : 0;
    if (this.showcase) {
      if (this.avatar && !this.dragging)
        animateCharacter(
          this.avatar,
          {
            x: 0,
            y: 0,
            input: {},
            anim: {
              type: "arcane",
              start: Math.floor(time / 9) * 9 + 6,
              duration: 1.8,
            },
          },
          time,
          dt,
          this.motion,
          true,
        );
      this.camera.position.set(0, 2.5, 9.5);
      this.camera.lookAt(0, 1.5, 0);
    } else {
      const p = player || { x: 48, y: 73 };
      this.cameraTarget.x = T.MathUtils.damp(this.cameraTarget.x, p.x, 7, dt);
      this.cameraTarget.z = T.MathUtils.damp(this.cameraTarget.z, p.y, 7, dt);
      this.cameraTarget.y = groundHeight(p.x, p.y);
      const dist = 1 / this.zoom;
      this.camera.position.set(
        this.cameraTarget.x,
        this.cameraTarget.y + 15 * dist,
        this.cameraTarget.z + 18 * dist,
      );
      this.camera.lookAt(
        this.cameraTarget.x,
        this.cameraTarget.y + 0.5,
        this.cameraTarget.z - 1.5,
      );
      this.sun.position.set(p.x - 14, 24, p.y + 10);
      this.sun.target.position.set(p.x, 0, p.y);
      this.uniforms.focus.value.set(p.x, 0, p.y);
      const outdoor = [...this.world.players.values()].filter(
        (a) => !Number.isInteger(a.inside),
      );
      this.uniforms.feet.value.forEach((v, i) =>
        v.set(outdoor[i]?.x ?? -999, 0, outdoor[i]?.y ?? -999),
      );
      const key = `${Math.floor(p.x / 16)}:${Math.floor(p.y / 16)}`;
      if (key !== this.chunkKey) {
        this.chunkKey = key;
        this.loadChunks(p.x, p.y);
      }
      this.updateResources();
      this.updateEntities(p, time, dt);
      this.updateInterior(p, time, dt);
      const weather = this.world.weather;
      this.water.visible = Math.abs(p.x - riverX(p.y)) < 35;
      this.water.material.uniforms.clock.value = this.motion ? time : 0;
      this.weatherPoints.visible = this.motion && weather !== "clear";
      this.weatherPoints.position.set(p.x, 0, p.y);
      this.flies.position.set(p.x, Math.sin(time * 0.5) * 0.2, p.y);
      this.flies.visible = this.motion && weather === "clear";
      if (this.weatherPoints.visible) {
        const a = this.weatherPoints.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) {
          const base = i * 3;
          a.setXYZ(
            i,
            this.weatherBase[base] + Math.sin(time + i) * 0.25,
            (((this.weatherBase[base + 1] -
              time * (weather === "snow" ? 1.4 : 16)) %
              18) +
              18) %
              18,
            this.weatherBase[base + 2],
          );
        }
        a.needsUpdate = true;
        this.weatherPoints.material.size = weather === "snow" ? 0.11 : 0.055;
      }
      this.sun.intensity = weather === "storm" ? 1.1 : 2.8;
      if (weather === "storm" && Math.sin(time * 0.7) > 0.998)
        this.sun.intensity = 7;
    }
    this.gl.setRenderTarget(this.target);
    this.gl.render(this.activeScene || this.scene, this.camera);
    this.gl.setRenderTarget(null);
    this.gl.render(this.post, this.postCam);
  }
  project(x, z, height = 3.4) {
    const v = new T.Vector3(x, groundHeight(x, z) + height, z).project(
      this.camera,
    );
    return {
      x: (v.x * 0.5 + 0.5) * this.w,
      y: (-0.5 * v.y + 0.5) * this.h,
      visible: v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1,
    };
  }
  disposeGroup(group) {
    const mats = new Set();
    group.traverse((o) => {
      if (o.isInstancedMesh) o.dispose();
      if (o.isMesh) {
        if (
          ![
            ...Array.from(
              ["sphere", "ico", "cylinder", "cone", "torus", "box"],
              geometry,
            ),
          ].includes(o.geometry)
        )
          o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (
            ![
              this.grassMat,
              this.bushMat,
              this.leafMat,
              this.waterMat,
            ].includes(m)
          )
            mats.add(m);
      }
    });
    mats.forEach((m) => m.dispose());
  }
  dispose() {
    this.observer.disconnect();
    this.water?.dispose();
    this.disposeGroup(this.scene);
    this.target.dispose();
    this.ascii.uniforms.atlas.value.dispose();
    this.ascii.dispose();
    this.grassMat.dispose();
    this.bushMat.dispose();
    if (this.roomScene) this.disposeGroup(this.roomScene);
    this.leafMat.dispose();
    this.waterMat.dispose();
    this.gl.dispose();
  }
}
