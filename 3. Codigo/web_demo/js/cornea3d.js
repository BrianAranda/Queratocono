/* ==========================================================================
   KERALYTIX — visor 3D de la córnea (Three.js r147, script clásico: funciona también abriendo index.html
   con doble clic, sin servidor).
   La superficie anterior se reconstruye con datos REALES del estudio:
     z(x, y) = casquete de la esfera de mejor ajuste (BFS anterior del PDF)
             + elevación anterior decodificada de la escala de color × exageración FIJA (×8, rotulada en la web)
   La cara posterior se separa según la paquimetría decodificada (grosor × factor visual).
   Coordenadas: x hacia la derecha del mapa, y hacia arriba (superior), z hacia el observador. Unidades: mm.
   ========================================================================== */
(function () {
  "use strict";

  const NR = 70, NS = 160;          // anillos y segmentos de la malla polar
  const TEX = 512;                   // lado de la textura dibujada
  const EXAGERACION = 8;             // factor FIJO de la elevación (±75 µm no se verían a escala real); se rotula en la web
  const ANG_MAX = 70 * Math.PI / 180;  // ángulo máximo entre la cámara y el eje óptico (+Z): nunca se ve la cara trasera
  const INCL_GIRO = 40 * Math.PI / 180; // inclinación de la cámara durante el giro automático
  const VUELTA_S = 40;                 // segundos por vuelta del giro automático

  function hexARgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

  /** Bilineal sobre una grilla N x N (fila 0 = superior) en coordenadas normalizadas (-1..1). */
  function muestrear(grilla, xn, yn) {
    const N = grilla.length;
    const fj = (xn + 1) / 2 * (N - 1), fi = (1 - yn) / 2 * (N - 1);
    const j0 = Math.max(0, Math.min(N - 1, Math.floor(fj))), i0 = Math.max(0, Math.min(N - 1, Math.floor(fi)));
    const j1 = Math.min(N - 1, j0 + 1), i1 = Math.min(N - 1, i0 + 1);
    const tx = fj - j0, ty = fi - i0;
    let s = 0, w = 0;
    const acumular = (v, p) => { if (v !== null && v !== undefined && p > 0) { s += v * p; w += p; } };
    acumular(grilla[i0][j0], (1 - tx) * (1 - ty)); acumular(grilla[i0][j1], tx * (1 - ty));
    acumular(grilla[i1][j0], (1 - tx) * ty); acumular(grilla[i1][j1], tx * ty);
    if (w > 0) return s / w;
    // borde del círculo: buscar el vecino válido más cercano hacia el centro
    for (let k = 1; k < 6; k++) {
      const f = 1 - k * 0.03;
      const v = muestrear0(grilla, xn * f, yn * f);
      if (v !== null) return v;
    }
    return null;
  }
  function muestrear0(grilla, xn, yn) {
    const N = grilla.length;
    const j = Math.round((xn + 1) / 2 * (N - 1)), i = Math.round((1 - yn) / 2 * (N - 1));
    if (i < 0 || j < 0 || i >= N || j >= N) return null;
    return grilla[i][j];
  }

  /** Color de un valor según la escala del PDF (16 colores, valores crecientes o decrecientes). */
  function colorEscala(escala, v) {
    const vals = escala.valores, cols = escala._rgb || (escala._rgb = escala.colores.map(hexARgb));
    const asc = vals[vals.length - 1] > vals[0];
    const n = vals.length;
    let t = asc ? (v - vals[0]) / (vals[n - 1] - vals[0]) : (vals[0] - v) / (vals[0] - vals[n - 1]);
    t = Math.max(0, Math.min(1, t)) * (n - 1);
    const k = Math.min(n - 2, Math.floor(t)), f = t - k;
    const a = cols[k], b = cols[k + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  function cargarImagen(src) {
    return new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = src; });
  }

  class CorneaVisor {
    constructor(contenedor, opciones = {}) {
      this.el = contenedor;
      this.op = Object.assign({ interactivo: true, autoRotar: false, puntos: true, bordes: true, onLectura: null,
                                exageracion: EXAGERACION, grosor: 1.6, onFinGiro: null }, opciones);
      this.capa = "Axial";
      this.verCam = false;
      this.opCam = 0.7;
      this.valoresImpresos = false;
      this.exag = this.op.exageracion;
      this.visible = true;
      this._iniciar();
    }

    _iniciar() {
      const ancho = this.el.clientWidth || 600, alto = this.el.clientHeight || 600;
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(ancho, alto);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.el.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.display = "block";
      this.renderer.domElement.setAttribute("aria-label", "Vista tridimensional de la córnea");

      this.escena = new THREE.Scene();
      if (THREE.RoomEnvironment) {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        this.escena.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      }
      this.escena.add(new THREE.HemisphereLight(0xffffff, 0xc9d6ea, 0.35));
      const clave = new THREE.DirectionalLight(0xffffff, 0.75); clave.position.set(6, 8, 12); this.escena.add(clave);
      const contra = new THREE.DirectionalLight(0xbfd4ff, 0.5); contra.position.set(-8, -4, -6); this.escena.add(contra);

      this.camara = new THREE.PerspectiveCamera(30, ancho / alto, 0.1, 200);
      this.camara.position.set(12.5, -10, 19.5);
      this.grupo = new THREE.Group();
      this.escena.add(this.grupo);

      this.controles = new THREE.OrbitControls(this.camara, this.renderer.domElement);
      this.controles.target.set(0, 0, 0.6);
      this.controles.enableDamping = true;
      this.controles.dampingFactor = 0.08;
      this.controles.enablePan = false;
      this.controles.minDistance = 9;
      this.controles.maxDistance = 44;
      // el giro automático NO usa autoRotate de OrbitControls (daría la vuelta completa y mostraría la cara
      // trasera): la cámara precesa alrededor del eje óptico, ver _girar()
      this.girando = this.op.autoRotar;
      this.controles.enabled = this.op.interactivo;
      this.controles.addEventListener("start", () => {
        if (!this.girando) return;
        this.girando = false;
        if (this.op.onFinGiro) this.op.onFinGiro();
      });
      if (!this.op.interactivo) this.renderer.domElement.style.pointerEvents = "none";

      // capa HTML para puntos y rótulos
      this.capaHtml = document.createElement("div");
      this.capaHtml.className = "puntos-3d";
      // capa de valores numéricos (opción "Valores"): etiquetas HTML nítidas, siempre de frente
      this.capaValores = document.createElement("div");
      this.capaValores.className = "valores-3d";
      this.el.appendChild(this.capaValores);
      this.el.appendChild(this.capaHtml);
      this.valores = [];

      this.raycaster = new THREE.Raycaster();
      this.puntero = new THREE.Vector2();
      if (this.op.interactivo && this.op.onLectura) {
        const dom = this.renderer.domElement;
        dom.addEventListener("pointermove", (e) => this._mover(e));
        dom.addEventListener("pointerleave", () => this.op.onLectura(null));
      }

      this._redimensionar = () => {
        const w = this.el.clientWidth, h = this.el.clientHeight;
        if (!w || !h) return;
        this.renderer.setSize(w, h);
        this.camara.aspect = w / h;
        this.camara.updateProjectionMatrix();
        // en pantallas angostas, alejar la cámara para que entre la córnea completa
        this.controles.minDistance = w < 520 ? 14 : 10;
        const base = w < 520 ? 37 : 24;
        if (base !== this.distBase) {
          this.distBase = base;
          const dir = this.camara.position.clone().sub(this.controles.target).normalize();
          this.camara.position.copy(this.controles.target).add(dir.multiplyScalar(base));
        }
      };
      this._ro = new ResizeObserver(this._redimensionar);
      this._ro.observe(this.el);
      this._io = new IntersectionObserver((ents) => { this.visible = ents[0].isIntersecting; });
      this._io.observe(this.el);

      this._t0 = performance.now();
      this._tPrev = this._t0;
      const bucle = (ahora) => {
        this._raf = requestAnimationFrame(bucle);
        const dt = Math.min(0.1, Math.max(0, ((ahora || performance.now()) - this._tPrev) / 1000));
        this._tPrev = ahora || performance.now();
        if (!this.visible || !this.malla) return;
        if (this.girando && !this.tween) this._girar(dt);
        this.controles.update();
        if (this.tween) this._paso();
        this._limitarVista();
        this.renderer.render(this.escena, this.camara);
        this._actualizarHtml();
      };
      bucle();
    }

    /** Carga un ojo: datos = KERALYTIX_ESTUDIO.ojos[ojo], cams = {mapa: dataURI} (puede faltar). */
    async cargar(ojo, datos, cams, circulo) {
      this.ojo = ojo;
      this.datos = datos;
      this.circulo = circulo;
      this.imgs = {};
      this.cams = {};
      const tareas = [];
      for (const m of Object.keys(datos.img)) tareas.push(cargarImagen(datos.img[m]).then((im) => { this.imgs[m] = im; }));
      for (const m of Object.keys(cams || {})) tareas.push(cargarImagen(cams[m]).then((im) => { this.cams[m] = im; }));
      await Promise.all(tareas);
      this._limpios = {};
      this._construirMalla();
      this._dibujarTextura();
      this._construirPuntos();
      this._construirValores();
    }

    _altura(xn, yn) {
      const c = this.datos.clinico, R = c.BFS_ant, rmm = Math.hypot(xn, yn) * 4.5;
      const base = Math.sqrt(Math.max(R * R - rmm * rmm, 0)) - Math.sqrt(Math.max(R * R - 4.5 * 4.5, 0));
      const r = Math.min(1, Math.hypot(xn, yn));
      const w = r < 0.84 ? 1 : Math.max(0, 1 - (r - 0.84) / 0.16) ** 2 * (3 - 2 * Math.max(0, 1 - (r - 0.84) / 0.16));
      const e = muestrear(this.datos.grillas.Anterior, xn, yn) || 0;
      return base + this.exag * e / 1000 * w;
    }

    _grosor(xn, yn) {
      const p = muestrear(this.datos.grillas.Pachymetry, xn, yn) || this.datos.clinico.paq_apice;
      return p / 1000 * this.op.grosor;
    }

    _geometria(fnZ, ringMax) {
      const pos = [], uv = [], idx = [];
      pos.push(0, 0, fnZ(0, 0)); uv.push(0.5, 0.5);
      for (let k = 1; k <= NR; k++) {
        const r = (k / NR) * ringMax;
        for (let s = 0; s < NS; s++) {
          const a = (s / NS) * Math.PI * 2, xn = r * Math.cos(a), yn = r * Math.sin(a);
          pos.push(xn * 4.5, yn * 4.5, fnZ(xn, yn));
          uv.push(xn * 0.5 + 0.5, yn * 0.5 + 0.5);
        }
      }
      for (let s = 0; s < NS; s++) idx.push(0, 1 + s, 1 + ((s + 1) % NS));
      for (let k = 1; k < NR; k++) {
        const a0 = 1 + (k - 1) * NS, a1 = 1 + k * NS;
        for (let s = 0; s < NS; s++) {
          const s1 = (s + 1) % NS;
          idx.push(a0 + s, a1 + s, a1 + s1, a0 + s, a1 + s1, a0 + s1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    _construirMalla() {
      while (this.grupo.children.length) {
        const o = this.grupo.children.pop();
        o.geometry && o.geometry.dispose();
        o.material && o.material.dispose();
      }
      const zAnt = (x, y) => this._altura(x, y);
      const zPost = (x, y) => this._altura(x, y) - this._grosor(x, y);

      this.lienzo = document.createElement("canvas");
      this.lienzo.width = this.lienzo.height = TEX;
      this.textura = new THREE.CanvasTexture(this.lienzo);
      this.textura.encoding = THREE.sRGBEncoding;
      this.textura.anisotropy = 4;

      const gAnt = this._geometria(zAnt, 1);
      this.malla = new THREE.Mesh(gAnt, new THREE.MeshPhysicalMaterial({
        map: this.textura, roughness: 0.5, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.18,
        envMapIntensity: 0.35 }));
      this.grupo.add(this.malla);

      // película "vítrea" por encima (epitelio / lágrima)
      const gVidrio = this._geometria((x, y) => zAnt(x, y) + 0.05, 1);
      this.grupo.add(new THREE.Mesh(gVidrio, new THREE.MeshPhysicalMaterial({
        color: 0xf3f8ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.12, clearcoat: 1,
        envMapIntensity: 1.2, depthWrite: false })));

      // cara posterior
      const gPost = this._geometria(zPost, 1);
      this.grupo.add(new THREE.Mesh(gPost, new THREE.MeshPhysicalMaterial({
        color: 0x9fc3ec, roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, envMapIntensity: 1.2 })));

      // pared del borde (une anterior y posterior)
      const pos = [], idx = [];
      for (let s = 0; s <= NS; s++) {
        const a = (s / NS) * Math.PI * 2, xn = Math.cos(a), yn = Math.sin(a);
        pos.push(xn * 4.5, yn * 4.5, zAnt(xn, yn), xn * 4.5, yn * 4.5, zPost(xn, yn));
        if (s < NS) { const b = s * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      const gPared = new THREE.BufferGeometry();
      gPared.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      gPared.setIndex(idx); gPared.computeVertexNormals();
      this.grupo.add(new THREE.Mesh(gPared, new THREE.MeshPhysicalMaterial({
        color: 0xcfe0f5, roughness: 0.15, transparent: true, opacity: 0.6, side: THREE.DoubleSide, clearcoat: 1 })));

      // limbo
      const zr = zPost(1, 0);
      const limbo = new THREE.Mesh(new THREE.TorusGeometry(4.62, 0.07, 16, 160), new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 1, envMapIntensity: 1.5 }));
      limbo.position.z = zr;
      this.grupo.add(limbo);
      const halo = new THREE.Mesh(new THREE.RingGeometry(4.75, 6.4, 128), new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
      halo.position.z = zr - 0.02;
      this.grupo.add(halo);
    }

    _texturaLimpia(m) {
      if (this._limpios[m]) return this._limpios[m];
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d");
      const im = ctx.createImageData(256, 256);
      const grilla = this.datos.grillas[m], esc = this.datos.escalas[m];
      for (let py = 0; py < 256; py++) {
        for (let px = 0; px < 256; px++) {
          const xn = (px + 0.5) / 128 - 1, yn = 1 - (py + 0.5) / 128;
          const o = (py * 256 + px) * 4;
          if (xn * xn + yn * yn > 1.04) { im.data[o + 3] = 0; continue; }
          const v = muestrear(grilla, Math.max(-1, Math.min(1, xn)), Math.max(-1, Math.min(1, yn)));
          const col = v === null ? [200, 200, 200] : colorEscala(esc, v);
          im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
        }
      }
      ctx.putImageData(im, 0, 0);
      return (this._limpios[m] = c);
    }

    _recorteCirculo(img) {
      const W = img.naturalWidth, cx = this.circulo.cx * W, cy = this.circulo.cy * W, r = this.circulo.r * W;
      return [cx - r, cy - r, 2 * r, 2 * r];
    }

    _dibujarTextura() {
      const ctx = this.lienzo.getContext("2d");
      ctx.clearRect(0, 0, TEX, TEX);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(this._texturaLimpia(this.capa), 0, 0, TEX, TEX);
      if (this.verCam && this.cams[this.capa]) {
        // velo oscuro leve para que resalte el calor
        ctx.fillStyle = "rgba(15,28,43,0.18)";
        ctx.fillRect(0, 0, TEX, TEX);
        ctx.globalAlpha = Math.min(1, this.opCam * 1.25);
        const [sx, sy, sw, sh] = this._recorteCirculo(this.cams[this.capa]);
        ctx.drawImage(this.cams[this.capa], sx, sy, sw, sh, 0, 0, TEX, TEX);
        ctx.globalAlpha = 1;
      }
      this.textura.needsUpdate = true;
    }

    _construirPuntos() {
      this.capaHtml.innerHTML = "";
      this.puntos = [];
      const c = this.datos.clinico, fmt = (v, d = 1) => v.toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
      const agregar = (xn, yn, html, clase, dz = 0.06) => {
        const el = document.createElement("div");
        el.className = "punto-3d " + (clase || "");
        el.innerHTML = html;
        this.capaHtml.appendChild(el);
        this.puntos.push({ el, p: new THREE.Vector3(xn * 4.5, yn * 4.5, this._altura(xn, yn) + dz), izq: /izq/.test(clase || "") });
      };
      if (this.op.bordes) {
        const izq = this.ojo === "OD" ? "T" : "N", der = this.ojo === "OD" ? "N" : "T";
        const z = this._altura(1, 0) - this._grosor(1, 0);
        [[-1.22, 0, izq], [1.22, 0, der], [0, 1.2, "S"], [0, -1.2, "I"]].forEach(([x, y, t]) => {
          const el = document.createElement("div");
          el.className = "rim-3d"; el.textContent = t;
          this.capaHtml.appendChild(el);
          this.puntos.push({ el, p: new THREE.Vector3(x * 4.5, y * 4.5, z) });
        });
      }
      if (!this.op.puntos) return;
      // ápice del cono = máximo de la elevación anterior dentro de la zona de 8 mm
      const g = this.datos.grillas.Anterior, N = g.length;
      let best = -1e9, bx = 0, by = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const xn = (j / (N - 1)) * 2 - 1, yn = 1 - (i / (N - 1)) * 2;
        if (xn * xn + yn * yn > 0.6 * 0.6 || g[i][j] === null) continue;
        if (g[i][j] > best) { best = g[i][j]; bx = xn; by = yn; }
      }
      const tope = best >= this.datos.rangos.Anterior[1] - 0.5 ? "≥ " : "";
      agregar(bx, by, `<div class="nodo"></div><div class="rotulo">Ápice del cono<b>${tope}${best > 0 ? "+" : ""}${fmt(best, 0)} µm</b></div>`, "izq");
      const [fx, fy] = c.paq_fina_xy;
      agregar(fx / 4.5, fy / 4.5, `<div class="nodo"></div><div class="rotulo">Punto más delgado<b>${fmt(c.paq_fina, 0)} µm</b></div>`, fx / 4.5 < bx ? "izq" : "");
      const [kx, ky] = c.Kmax_xy;
      agregar(kx / 4.5, ky / 4.5, `<div class="nodo"></div><div class="rotulo">K máx. anterior<b>${fmt(c.Kmax)} D</b></div>`, "");
    }

    /** Valores del mapa activo en una grilla regular (cada 1 mm, 1,5 mm en pantallas angostas), como Pentacam. */
    _construirValores() {
      this.capaValores.innerHTML = "";
      this.valores = [];
      if (!this.datos || !this.valoresImpresos || this.verCam) return;
      const paso = this.el.clientWidth < 520 ? 1.5 : 1, grilla = this.datos.grillas[this.capa];
      const dec = this.capa === "Axial" ? 1 : 0, signo = this.capa === "Anterior" || this.capa === "Posterior";
      // la escala de color del PDF satura en sus extremos: ahí el valor real puede ser mayor (o menor)
      const ev = this.datos.escalas[this.capa].valores, eMin = Math.min(ev[0], ev[ev.length - 1]), eMax = Math.max(ev[0], ev[ev.length - 1]);
      const tolE = (eMax - eMin) * 0.004;
      this._pasoValores = paso;
      for (let ymm = -4; ymm <= 4.001; ymm += paso) {
        for (let xmm = -4; xmm <= 4.001; xmm += paso) {
          if (Math.hypot(xmm, ymm) > 4.05) continue;
          const xn = xmm / 4.5, yn = ymm / 4.5, val = muestrear(grilla, xn, yn);
          if (val === null) continue;
          const el = document.createElement("div");
          el.className = "valor-3d num";
          let txt = val.toLocaleString("es-AR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
          if (signo && Math.round(val) > 0) txt = "+" + txt;
          if (val >= eMax - tolE) txt = "≥" + txt; else if (val <= eMin + tolE) txt = "≤" + txt;
          el.textContent = txt;
          this.capaValores.appendChild(el);
          this.valores.push({ el, p: new THREE.Vector3(xn * 4.5, yn * 4.5, this._altura(xn, yn) + 0.06), ancho: txt.length * 6.4 + 2 });
        }
      }
      this.valores.sort((a, b) => Math.hypot(a.p.x, a.p.y) - Math.hypot(b.p.x, b.p.y));
    }

    _actualizarHtml() {
      if (!this.puntos) return;
      const w = this.el.clientWidth, h = this.el.clientHeight, v = new THREE.Vector3();
      if (this.valores.length && (w < 520 ? 1.5 : 1) !== this._pasoValores) this._construirValores();
      // los valores que quedarían encimados (vistas oblicuas) se ocultan, en orden desde el centro
      const vis = [];
      for (const q of this.valores) {
        v.copy(q.p).applyMatrix4(this.grupo.matrixWorld).project(this.camara);
        const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
        q.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        const choca = vis.some((o) => Math.abs(o.x - x) < (o.ancho + q.ancho) / 2 && Math.abs(o.y - y) < 12);
        q.el.style.opacity = choca ? 0 : 1;
        if (!choca) vis.push({ x, y, ancho: q.ancho });
      }
      const dirCam = new THREE.Vector3(); this.camara.getWorldDirection(dirCam);
      for (const pt of this.puntos) {
        v.copy(pt.p).applyMatrix4(this.grupo.matrixWorld).project(this.camara);
        const fuera = v.z > 1;
        pt.el.style.left = ((v.x + 1) / 2 * w).toFixed(1) + "px";
        pt.el.style.top = ((1 - v.y) / 2 * h).toFixed(1) + "px";
        // ocultar los puntos de la cara anterior si se mira desde atrás
        const atras = dirCam.z > 0.15 && !pt.el.classList.contains("rim-3d");
        pt.el.style.opacity = fuera || atras ? 0 : 1;
        if (pt.izq !== undefined) {   // el rótulo cambia de lado si se saldría del lienzo
          const x = (v.x + 1) / 2 * w;
          const izq = pt.izq ? x > 130 : x > w - 130;
          pt.el.classList.toggle("izq", izq);
        }
      }
      // separar verticalmente los rótulos que quedan del mismo lado y demasiado cerca
      const marcados = this.puntos.filter((p) => p.izq !== undefined);
      const pos = marcados.map((p) => ({ p, x: parseFloat(p.el.style.left), y: parseFloat(p.el.style.top), izq: p.el.classList.contains("izq"), dy: 0 }));
      pos.sort((a, b) => a.y - b.y);
      for (let i = 0; i < pos.length; i++) {
        for (let j = 0; j < i; j++) {
          const a = pos[j], b = pos[i];
          if (a.izq === b.izq && Math.abs(a.x - b.x) < 140 && Math.abs((b.y + b.dy) - (a.y + a.dy)) < 44) {
            b.dy = a.y + a.dy + 44 - b.y;
          }
        }
      }
      for (const q of pos) {
        const r = q.p.el.querySelector(".rotulo");
        if (r) r.style.transform = `translateY(calc(-50% + ${q.dy.toFixed(0)}px))`;
      }
    }

    _mover(e) {
      const r = this.renderer.domElement.getBoundingClientRect();
      this.puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.raycaster.setFromCamera(this.puntero, this.camara);
      const hit = this.raycaster.intersectObject(this.malla, false)[0];
      if (!hit || !hit.uv) { this.op.onLectura(null); return; }
      const xn = hit.uv.x * 2 - 1, yn = hit.uv.y * 2 - 1;
      const val = {};
      for (const m of Object.keys(this.datos.grillas)) val[m] = muestrear(this.datos.grillas[m], xn, yn);
      this.op.onLectura({ x: e.clientX - r.left, y: e.clientY - r.top, xmm: xn * 4.5, ymm: yn * 4.5, val });
    }

    // ---------- API pública ----------
    setCapa(m) { this.capa = m; this._dibujarTextura(); this._construirValores(); }
    setGradcam(on) { this.verCam = on; this._dibujarTextura(); this._construirValores(); }
    setOpacidadCam(v) { this.opCam = v; if (this.verCam) this._dibujarTextura(); }
    setValoresImpresos(on) { this.valoresImpresos = on; this._construirValores(); }
    setAutoRotar(on) { this.girando = on; }

    /** Precesión de la cámara alrededor del eje óptico, con la inclinación llevada suavemente a INCL_GIRO. */
    _girar(dt) {
      const tg = this.controles.target, v = this.camara.position.clone().sub(tg);
      const d = v.length(), u = v.clone().divideScalar(d);
      let th = Math.acos(Math.max(-1, Math.min(1, u.z)));
      let ph = Math.atan2(u.y, u.x);
      th += (INCL_GIRO - th) * Math.min(1, dt * 1.5);
      ph += (2 * Math.PI / VUELTA_S) * dt;
      this.camara.position.set(tg.x + d * Math.sin(th) * Math.cos(ph), tg.y + d * Math.sin(th) * Math.sin(ph),
                               tg.z + d * Math.cos(th));
    }

    /** Mantiene la cámara dentro de un cono de ANG_MAX alrededor de +Z (la cara posterior nunca queda a la vista). */
    _limitarVista() {
      const tg = this.controles.target, v = this.camara.position.clone().sub(tg);
      const d = v.length();
      if (v.z / d >= Math.cos(ANG_MAX)) return;
      let hx = v.x, hy = v.y;
      const h = Math.hypot(hx, hy);
      if (h < 1e-6) { hx = 1; hy = 0; } else { hx /= h; hy /= h; }
      this.camara.position.set(tg.x + d * Math.sin(ANG_MAX) * hx, tg.y + d * Math.sin(ANG_MAX) * hy,
                               tg.z + d * Math.cos(ANG_MAX));
      this.camara.lookAt(tg);
    }

    vista(nombre) {
      const d = this.distBase || this.camara.position.distanceTo(this.controles.target);
      const destinos = {
        frontal: new THREE.Vector3(0, -0.01, 1),
        perfil: new THREE.Vector3(1, -0.08, 0.38),
        oblicua: new THREE.Vector3(0.55, -0.45, 0.72),
        inferior: new THREE.Vector3(0.05, -1, 0.25),
      };
      const dir = (destinos[nombre] || destinos.oblicua).clone().normalize();
      this.tween = { desde: this.camara.position.clone(), hasta: this.controles.target.clone().add(dir.multiplyScalar(d)), t: 0 };
    }
    _paso() {
      this.tween.t = Math.min(1, this.tween.t + 0.035);
      const k = 1 - Math.pow(1 - this.tween.t, 3);
      this.camara.position.lerpVectors(this.tween.desde, this.tween.hasta, k);
      if (this.tween.t >= 1) this.tween = null;
    }
    captura() { this.renderer.render(this.escena, this.camara); return this.renderer.domElement.toDataURL("image/png"); }
  }

  CorneaVisor.EXAGERACION = EXAGERACION;
  window.CorneaVisor = CorneaVisor;
  window.KX3D = { colorEscala, muestrear };
})();
