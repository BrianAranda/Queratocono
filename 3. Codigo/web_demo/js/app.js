/* ==========================================================================
   KERALYTIX — lógica de la demo
   El PDF solo dispara el flujo: los mapas (página 3) y los resultados del modelo ya vienen precalculados en
   assets/datos_estudio.js y assets/resultados_demo.js. Los tiempos de carga son artificiales.
   ========================================================================== */
(function () {
  "use strict";

  const E = window.KERALYTIX_ESTUDIO;
  const R = window.KERALYTIX_RESULTADOS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const NOMBRE = { Axial: "Curvatura sagital", Anterior: "Elevación anterior", Pachymetry: "Paquimetría", Posterior: "Elevación posterior" };
  const UNIDAD = { Axial: "D", Anterior: "µm", Pachymetry: "µm", Posterior: "µm" };
  const DESC_CAPA = {
    Axial: "color: curvatura sagital anterior (D)", Anterior: "color: elevación anterior respecto de la BFS (µm)",
    Pachymetry: "color: espesor corneal (µm)", Posterior: "color: elevación posterior respecto de la BFS (µm)",
  };
  const OJO_TXT = { OD: "Ojo derecho", OS: "Ojo izquierdo" };
  const ORDEN = ["Axial", "Anterior", "Pachymetry", "Posterior"];

  const fmt = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v)) ? "–" :
    Number(v).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = (p) => fmt(p * 100, 0) + " %";

  // ------------------------------------------------------------------ navegación
  const vistas = { inicio: $("#vista-inicio"), analisis: $("#vista-analisis") };
  function irA(v, empujar = true) {
    Object.entries(vistas).forEach(([k, el]) => el.classList.toggle("oculto", k !== v));
    $("#nav").classList.remove("abierto");
    $("#menu-btn").setAttribute("aria-expanded", "false");
    if (empujar) history.pushState({ v }, "", v === "inicio" ? "#/" : "#/analisis");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (v === "analisis" && estado.etapa === "res" && visorRes) setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-ir]");
    if (a) { e.preventDefault(); irA(a.dataset.ir); return; }
    const s = e.target.closest("[data-seccion]");
    if (s && !vistas.analisis.classList.contains("oculto")) {
      e.preventDefault(); irA("inicio");
      setTimeout(() => document.querySelector(s.getAttribute("href")).scrollIntoView({ behavior: "smooth" }), 60);
    } else if (s) { $("#nav").classList.remove("abierto"); }
  });
  window.addEventListener("popstate", () => irA(location.hash.startsWith("#/analisis") ? "analisis" : "inicio", false));
  $("#menu-btn").addEventListener("click", () => {
    const abierto = $("#nav").classList.toggle("abierto");
    $("#menu-btn").setAttribute("aria-expanded", String(abierto));
  });

  // ------------------------------------------------------------------ hero 3D
  let visorHero = null;
  function iniciarHero() {
    if (!window.THREE || !window.CorneaVisor) return;
    visorHero = new CorneaVisor($("#hero-3d"), { interactivo: false, autoRotar: !reducido, puntos: false, bordes: false });
    visorHero.cargar("OD", E.ojos.OD, null, E.circulo).then(() => {
      visorHero.camara.position.set(12.5, -12, 17.5);
    });
    const c = E.ojos.OD.clinico;
    $("#hero-kmax").innerHTML = `${fmt(c.Kmax)}<small>D</small>`;
    $("#hero-paq").innerHTML = `${fmt(c.paq_fina, 0)}<small>µm</small>`;
  }

  // ------------------------------------------------------------------ etapa 1: carga
  const estado = { archivos: {}, etapa: "carga", ojo: null };
  const zona = $("#zona-drop"), entrada = $("#entrada-archivo");


  function mostrarError(msg) {
    const el = $("#error-carga");
    el.textContent = msg; el.classList.toggle("oculto", !msg);
  }

  // Demo pública: solo se analizan los dos estudios de ejemplo. Cualquier archivo que suba el usuario se
  // "verifica" y se rechaza por formato (nunca se lee su contenido: no sale del navegador).
  let nRechazo = 0;
  async function agregar(lista) {
    mostrarError("");
    const errores = [];
    for (const f of lista) {
      const nombre = String(f.name || "archivo");
      if (!/\.pdf$/i.test(nombre) && f.type !== "application/pdf") { errores.push(`“${nombre}” no es un PDF.`); continue; }
      const id = "X" + (++nRechazo);
      estado.archivos[id] = { nombre, bytes: f.size, ojo: null, leyendo: true };
      pintarArchivos();
      await esperar(reducido ? 100 : 1600);
      if (!estado.archivos[id]) continue;              // lo quitaron mientras se verificaba
      estado.archivos[id].leyendo = false;
      estado.archivos[id].rechazado = true;
      pintarArchivos();
      errores.push(`“${nombre}” no corresponde al formato de estudio de queratocono esperado (informe Pentacam con los 4 mapas refractivos). Para esta demo usá los estudios de ejemplo.`);
    }
    if (errores.length) mostrarError(errores.join(" "));
  }

  async function agregarEjemplos() {
    mostrarError("");
    for (const id of Object.keys(estado.archivos)) if (estado.archivos[id].rechazado) delete estado.archivos[id];
    for (const ojo of ["OD", "OS"]) {
      estado.archivos[ojo] = { nombre: E.pdf[ojo].archivo, bytes: E.pdf[ojo].bytes, ojo, leyendo: true };
      pintarArchivos();
      await esperar(reducido ? 50 : 650);
      estado.archivos[ojo].leyendo = false;
      pintarArchivos();
    }
  }

  function pintarArchivos() {
    const cont = $("#lista-archivos");
    cont.innerHTML = "";
    for (const id of Object.keys(estado.archivos)) {
      const a = estado.archivos[id], ojo = a.ojo;
      const div = document.createElement("div");
      div.className = "archivo";
      const mb = (a.bytes / 1048576).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + " MB";
      const detalle = a.leyendo ? "verificando formato…" : a.rechazado ? "formato no reconocido" : `OCULUS Pentacam · 12 páginas · ${OJO_TXT[ojo]} (${ojo})`;
      const chip = a.leyendo ? '<span class="chip">Verificando</span>' : a.rechazado ? '<span class="chip rojo">No válido</span>' : '<span class="chip verde">Válido</span>';
      div.innerHTML = `
        <div class="pdf">PDF</div>
        <div class="info"><b></b><span>${mb} · ${detalle}</span></div>
        ${chip}
        <button class="quitar" aria-label="Quitar archivo" data-quitar="${id}">✕</button>`;
      div.querySelector("b").textContent = a.nombre;
      cont.appendChild(div);
    }
    const listos = Object.values(estado.archivos).filter((a) => !a.leyendo && !a.rechazado);
    $("#btn-analizar").disabled = listos.length === 0;
    $("#btn-analizar").firstChild.textContent = listos.length === 2 ? "Analizar ambos ojos " : "Analizar estudio ";
  }

  $("#lista-archivos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-quitar]");
    if (b) { delete estado.archivos[b.dataset.quitar]; pintarArchivos(); }
  });
  zona.addEventListener("click", () => entrada.click());
  zona.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); entrada.click(); } });
  entrada.addEventListener("change", () => { agregar(Array.from(entrada.files)); entrada.value = ""; });
  ["dragenter", "dragover"].forEach((t) => zona.addEventListener(t, (e) => { e.preventDefault(); zona.classList.add("arrastrando"); }));
  ["dragleave", "dragend"].forEach((t) => zona.addEventListener(t, () => zona.classList.remove("arrastrando")));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("arrastrando"); agregar(Array.from(e.dataTransfer.files)); });
  // evitar que soltar un PDF fuera de la zona lo abra en el navegador
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => e.preventDefault());
  $("#usar-ejemplos").addEventListener("click", agregarEjemplos);
  $("#btn-analizar").addEventListener("click", analizar);

  function pasador(n) {
    ["p1", "p2", "p3"].forEach((id, i) => {
      const el = $("#" + id);
      el.classList.toggle("activo", i + 1 === n);
      el.classList.toggle("hecho", i + 1 < n);
    });
  }
  function etapa(nombre) {
    estado.etapa = nombre;
    $("#etapa-carga").classList.toggle("oculto", nombre !== "carga");
    $("#etapa-proc").classList.toggle("oculto", nombre !== "proc");
    $("#etapa-res").classList.toggle("oculto", nombre !== "res");
    pasador({ carga: 1, proc: 2, res: 3 }[nombre]);
  }

  // ------------------------------------------------------------------ etapa 2: procesamiento simulado
  async function analizar() {
    const ojos = ["OD", "OS"].filter((o) => estado.archivos[o] && !estado.archivos[o].leyendo);
    if (!ojos.length) return;
    etapa("proc");
    $("#titulo-analisis").textContent = "Analizando";
    $("#sub-analisis").textContent = ojos.length === 2 ? "Ambos ojos · estudio Pentacam" : `${OJO_TXT[ojos[0]]} · estudio Pentacam`;
    window.scrollTo({ top: 0 });
    const con = $("#consola");
    con.innerHTML = "";
    const log = (t, ok) => {
      const d = document.createElement("div");
      d.textContent = t; if (ok) d.className = "ok";
      con.appendChild(d);
      while (con.children.length > 6) con.removeChild(con.firstChild);
    };
    const mod = R.modelo || {};
    const velocidad = reducido ? 0.15 : 1;
    const pasos = [];
    ojos.forEach((o, k) => {
      const f = k === 0 ? 1 : 0.6;
      const r = R.ojos[o];
      pasos.push({ ojo: o, t: `Leyendo PDF de ${o} (12 páginas)`, ms: 650 * f, log: `GET estudio ${o} · OCULUS Pentacam 1.31r02 · 12 páginas` });
      pasos.push({ ojo: o, t: "Localizando “4 mapas refractivos” (pág. 3)", ms: 750 * f, log: `página 3 detectada · anonimización verificada` });
      pasos.push({ ojo: o, t: "Extrayendo y normalizando los 4 mapas", ms: 850 * f, accion: "mapas",
                   log: `recorte 560×560 · marcas T/N tapadas${o === "OS" ? " · espejado OS→OD" : ""}` });
      ORDEN.forEach((m) => pasos.push({ ojo: o, mapa: m, t: `Modelo · ${NOMBRE[m]}`, ms: 620 * f,
        log: `POST /api/v1/inferir ojo=${o} mapa=${m} → P(QC)=${fmt(r.mapas[m].prob, 3)}` }));
      pasos.push({ ojo: o, t: "Fusión de mapas y umbral τ", ms: 600 * f,
                   log: `fusión=${fmt(r.prob, 3)} · τ=${fmt(r.tau, 3)} → ${r.pred ? "QUERATOCONO" : "sano"}`, ok: true });
      pasos.push({ ojo: o, t: "Grad-CAM de la clase predicha", ms: 750 * f, log: `grad-cam ${ORDEN.length} mapas · ${mod.backbone || "cnn"}` });
      pasos.push({ ojo: o, t: "Reconstrucción 3D de la superficie", ms: 650 * f, log: `BFS ${fmt(E.ojos[o].clinico.BFS_ant, 2)} mm + elevación · malla ${70 * 160} vértices`, ok: true });
    });
    const lista = $("#proc-lista");
    lista.innerHTML = "";
    // en la lista se muestran los pasos del ojo actual
    let ojoActual = null;
    const total = pasos.reduce((s, p) => s + p.ms, 0);
    let acumulado = 0;
    for (let i = 0; i < pasos.length; i++) {
      const p = pasos[i];
      if (p.ojo !== ojoActual) {
        ojoActual = p.ojo;
        prepararGrillaProc(p.ojo);
        lista.innerHTML = pasos.filter((q) => q.ojo === p.ojo)
          .map((q) => `<li data-i="${pasos.indexOf(q)}"><span class="st"></span><span>${q.t}</span><small></small></li>`).join("");
        log(`── ${OJO_TXT[p.ojo]} (${p.ojo}) ──`);
      }
      const li = lista.querySelector(`[data-i="${i}"]`);
      li.classList.add("activo");
      if (p.accion === "mapas") revelarMapas();
      if (p.mapa) marcarMapa(p.mapa, "analizando");
      const t0 = performance.now();
      await esperar(p.ms * velocidad);
      li.classList.remove("activo"); li.classList.add("hecho");
      li.querySelector("small").textContent = ((performance.now() - t0) / 1000).toFixed(2) + " s";
      if (p.mapa) marcarMapa(p.mapa, "listo");
      log(p.log, p.ok);
      acumulado += p.ms;
      const v = Math.round((acumulado / total) * 100);
      $("#proc-barra").style.width = v + "%";
      $("#proc-pct").textContent = v + " %";
    }
    await esperar(400 * velocidad);
    mostrarResultados(ojos);
  }

  function prepararGrillaProc(ojo) {
    $("#proc-titulo").textContent = `Mapas extraídos · ${OJO_TXT[ojo]} (${ojo})`;
    $("#proc-grilla").innerHTML = ORDEN.map((m) => `
      <div class="proc-mapa" data-m="${m}">
        <img src="${E.ojos[ojo].img[m]}" alt="${NOMBRE[m]}">
        <span class="tag">${NOMBRE[m]}</span>
        <span class="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span>
      </div>`).join("");
  }
  async function revelarMapas() {
    for (const el of $$(".proc-mapa")) { el.classList.add("visible"); await esperar(reducido ? 0 : 140); }
  }
  function marcarMapa(m, clase) {
    const el = $(`.proc-mapa[data-m="${m}"]`);
    if (!el) return;
    el.classList.remove("analizando");
    el.classList.add(clase);
  }

  // ------------------------------------------------------------------ etapa 3: resultados
  let visorRes = null;
  function mostrarResultados(ojos) {
    etapa("res");
    estado.ojos = ojos;
    $("#titulo-analisis").textContent = "Resultados";
    const qc = ojos.filter((o) => R.ojos[o].pred === 1);
    $("#sub-analisis").textContent = ojos.length === 2
      ? (qc.length === 2 ? "Ambos ojos son compatibles con queratocono." : qc.length ? `${OJO_TXT[qc[0]]} compatible con queratocono.` : "Sin hallazgos compatibles con queratocono.")
      : `${OJO_TXT[ojos[0]]} · ${R.ojos[ojos[0]].pred ? "compatible con queratocono" : "sin hallazgos compatibles"}`;
    const sel = $("#selector-ojo");
    sel.innerHTML = ojos.map((o) => `<button role="tab" data-ojo="${o}">${OJO_TXT[o]} · ${o}</button>`).join("");
    sel.classList.toggle("oculto", ojos.length < 2);
    $("#chip-placeholder").classList.toggle("oculto", R.fuente === "colab");
    pintarModelo();
    window.scrollTo({ top: 0 });
    if (!visorRes && window.THREE) {
      visorRes = new CorneaVisor($("#res-3d"), { interactivo: true, onLectura: lectura, onFinGiro: () => {
        const b = $("#btn-rotar"); b.classList.remove("activo"); b.setAttribute("aria-pressed", "false");
      } });
    }
    seleccionarOjo(ojos[0]);
  }

  $("#selector-ojo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ojo]");
    if (b) seleccionarOjo(b.dataset.ojo);
  });

  async function seleccionarOjo(ojo) {
    estado.ojo = ojo;
    $$("#selector-ojo button").forEach((b) => { b.classList.toggle("activo", b.dataset.ojo === ojo); b.setAttribute("aria-selected", b.dataset.ojo === ojo); });
    const r = R.ojos[ojo], d = E.ojos[ojo];
    pintarVeredicto(ojo, r, d);
    pintarBarras(r);
    pintarClinico(d.clinico);
    pintarMapas(ojo);
    $("#visor-ojo").textContent = `${ojo}`;
    $("#fl-prob").innerHTML = `${fmt(r.prob * 100, 0)}<small>%</small>`;
    $("#fl-abcd").textContent = d.clinico.abcd || "–";
    if (visorRes) {
      await visorRes.cargar(ojo, d, r.gradcam, E.circulo);
      visorRes.setCapa($("#sel-capa").value);
      visorRes.setGradcam($("#btn-cam").classList.contains("activo"));
      visorRes.setOpacidadCam(+$("#rng-cam").value);
      if (!estado.vistaIniciada) { visorRes.vista("oblicua"); estado.vistaIniciada = true; }
      pintarLeyenda();
    }
  }

  function pintarVeredicto(ojo, r, d) {
    const qc = r.pred === 1;
    const nivel = r.prob >= 0.9 ? "alta" : r.prob >= r.tau ? "moderada" : r.prob >= r.tau * 0.7 ? "limítrofe" : "baja";
    const C = 2 * Math.PI * 52;
    const col = qc ? "var(--rojo)" : "var(--verde)";
    const angTau = r.tau * 360 - 90;
    const tx = 66 + 52 * Math.cos(angTau * Math.PI / 180), ty = 66 + 52 * Math.sin(angTau * Math.PI / 180);
    const el = $("#veredicto");
    el.className = "panel veredicto " + (qc ? "qc" : "sano");
    el.innerHTML = `
      <div class="sup">
        <span class="chip ${qc ? "rojo" : "verde"}">${qc ? "Positivo" : "Negativo"} · evidencia ${nivel}</span>
        <span class="chip">${OJO_TXT[ojo]} · ${ojo}</span>
      </div>
      <h2>${qc ? "Compatible con queratocono" : "Sin signos de queratocono"}</h2>
      <p class="sub">Decisión por fusión de los 4 mapas corneales.</p>
      <div class="medidor">
        <svg viewBox="0 0 132 132" role="img" aria-label="Probabilidad ${pct(r.prob)}">
          <circle cx="66" cy="66" r="52" fill="none" stroke="#e9eef4" stroke-width="12"/>
          <circle cx="66" cy="66" r="52" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 66 66)" id="arco">
          </circle>
          <circle cx="${tx}" cy="${ty}" r="5" fill="#fff" stroke="var(--tinta)" stroke-width="2.5"/>
          <text x="66" y="66" text-anchor="middle" font-size="28" font-weight="700" fill="var(--tinta)" font-family="Plus Jakarta Sans">${fmt(r.prob * 100, 0)}%</text>
          <text x="66" y="86" text-anchor="middle" font-size="10.5" fill="var(--tenue)" font-family="Plus Jakarta Sans">P(queratocono)</text>
        </svg>
        <div class="lectura">
          <div>Umbral τ <b class="num">${fmt(r.tau, 3)}</b><br><span style="font-size:12px">calibrado para sensibilidad ≥ 95 % (OOF)</span></div>
          <div>Margen <b class="num">${r.prob >= r.tau ? "+" : ""}${fmt((r.prob - r.tau) * 100, 0)} p.p.</b> sobre τ</div>
        </div>
      </div>
      <div class="recom">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>
        <span>${qc ? "Sugerencia del sistema: correlacionar con la clínica y la refracción, considerar la evaluación por un especialista en córnea y un seguimiento tomográfico para documentar la progresión."
                   : "Sugerencia del sistema: sin hallazgos que superen el umbral. Si hay sospecha clínica, repetir el estudio y controlar la evolución."}</span>
      </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const a = $("#arco");
      if (a) { a.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)"; a.setAttribute("stroke-dashoffset", String(C * (1 - r.prob))); }
    }));
  }

  function pintarBarras(r) {
    $("#barras-mapa").innerHTML = ORDEN.map((m) => {
      const x = r.mapas[m];
      return `<div class="barra-mapa ${x.prob >= x.tau ? "" : "neg"}">
        <div class="rot"><span>${NOMBRE[m]}</span><b class="num">${pct(x.prob)}</b></div>
        <div class="pista"><i data-w="${(x.prob * 100).toFixed(1)}"></i><u style="left:calc(${(x.tau * 100).toFixed(1)}% - 1px)" title="τ = ${fmt(x.tau, 3)}"></u></div>
      </div>`;
    }).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => $$("#barras-mapa i").forEach((i) => { i.style.width = i.dataset.w + "%"; })));
  }

  function pintarClinico(c) {
    const filas = [
      ["K1 / K2 anterior", `${fmt(c.K1)} / ${fmt(c.K2)} D`, c.K2 > 47.2],
      ["K máx. anterior", `${fmt(c.Kmax)} D`, c.Kmax > 47.2],
      ["Astigmatismo corneal", `${fmt(c.astig)} D`, c.astig > 2],
      ["Asfericidad Q (8 mm)", fmt(c.Q, 2), c.Q < -0.6],
      ["Paquimetría más delgada", `${fmt(c.paq_fina, 0)} µm`, c.paq_fina < 470],
      ["Paquimetría en el ápice", `${fmt(c.paq_apice, 0)} µm`, c.paq_apice < 490],
      ["ISV / KI", `${fmt(c.ISV, 0)} / ${fmt(c.KI, 2)}`, c.ISV >= 37 || c.KI > 1.07],
      ["Topometric KC", c.tkc || "–", !!c.tkc],
      ["Belin ABCD", c.abcd || "–", !!c.abcd],
    ];
    if (c.BAD_D !== null && c.BAD_D !== undefined) filas.push(["BAD D (Belin/Ambrósio)", fmt(c.BAD_D, 2), c.BAD_D >= 2.6]);
    $("#tabla-clinica").innerHTML = filas.map(([k, v, alto]) =>
      `<tr><td>${k}</td><td class="${alto ? "alto" : ""}">${v}</td></tr>`).join("") +
      `<tr><td colspan="2" style="font-size:12px;color:var(--tenue);text-align:left;font-weight:400">En rojo: fuera del rango de referencia habitual. Son valores leídos del PDF; no son una salida del modelo.</td></tr>`;
  }

  function pintarMapas(ojo) {
    const r = R.ojos[ojo], d = E.ojos[ojo], op = +$("#rng-cam").value;
    $("#grilla-mapas").innerHTML = ORDEN.map((m) => `
      <figure class="mapa-card" data-m="${m}" tabindex="0" role="button" aria-label="Ampliar ${NOMBRE[m]}">
        <div class="img"><img src="${d.img[m]}" alt="${NOMBRE[m]} ${ojo}">${r.gradcam && r.gradcam[m] ? `<img class="cam" src="${r.gradcam[m]}" alt="" style="opacity:${op}">` : ""}</div>
        <figcaption class="pie-mapa"><div><b>${NOMBRE[m]}</b><span>${m} · ${UNIDAD[m]}</span></div>
          <span class="chip ${r.mapas[m].prob >= r.mapas[m].tau ? "rojo" : "verde"} num">${pct(r.mapas[m].prob)}</span></figcaption>
      </figure>`).join("");
  }
  $("#rng-cam").addEventListener("input", (e) => {
    $$("#grilla-mapas img.cam").forEach((i) => { i.style.opacity = e.target.value; });
    if (visorRes) visorRes.setOpacidadCam(+e.target.value);
  });
  $("#grilla-mapas").addEventListener("click", (e) => { const f = e.target.closest(".mapa-card"); if (f) abrirModal(f.dataset.m); });
  $("#grilla-mapas").addEventListener("keydown", (e) => { const f = e.target.closest(".mapa-card"); if (f && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirModal(f.dataset.m); } });

  function abrirModal(m) {
    const ojo = estado.ojo, r = R.ojos[ojo], d = E.ojos[ojo];
    const modal = $("#modal");
    modal.innerHTML = `<div class="caja">
      <div class="img"><img src="${d.img[m]}" alt="${NOMBRE[m]}">${r.gradcam && r.gradcam[m] ? `<img id="modal-cam" src="${r.gradcam[m]}" alt="" style="opacity:${$("#rng-cam").value}">` : ""}</div>
      <div class="fila"><div><b>${NOMBRE[m]}</b> · ${OJO_TXT[ojo]} · P(QC) ${pct(r.mapas[m].prob)}</div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--suave)">Grad-CAM <input type="range" min="0" max="1" step="0.05" value="${$("#rng-cam").value}" id="modal-rng"></label>
        <button class="btn btn-fantasma btn-chico" id="modal-cerrar">Cerrar</button></div></div>`;
    modal.classList.remove("oculto");
    $("#modal-cerrar").focus();
    const rng = $("#modal-rng"), cam = $("#modal-cam");
    rng.addEventListener("input", () => { if (cam) cam.style.opacity = rng.value; });
    $("#modal-cerrar").addEventListener("click", cerrarModal);
  }
  function cerrarModal() { $("#modal").classList.add("oculto"); $("#modal").innerHTML = ""; }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") cerrarModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

  function pintarModelo() {
    const m = R.modelo || {};
    const chip = $("#chip-fuente");
    chip.textContent = R.fuente === "colab" ? "inferencia real" : "ilustrativo";
    chip.className = "chip " + (R.fuente === "colab" ? "verde" : "ambar");
    const filas = [
      ["Modelo", m.nombre], ["Backbone", m.backbone], ["Entrada", m.entrada_px ? `${m.entrada_px} px` : null],
      ["Umbral τ (fusión)", m.tau_fusion !== undefined ? fmt(m.tau_fusion, 3) : null],
      ["AUC validación (OOF)", m.auc_oof !== null && m.auc_oof !== undefined ? fmt(m.auc_oof, 3) : "pendiente"],
      ["Sensibilidad / especificidad test", m.sens_test !== null && m.sens_test !== undefined ? `${pct(m.sens_test)} / ${pct(m.esp_test)}` : "pendiente"],
      ["Fracción del dataset", m.fraccion_datos ? pct(m.fraccion_datos) : null],
      ["Generado", R.generado],
    ].filter(([, v]) => v !== null && v !== undefined && v !== "");
    $("#dl-modelo").innerHTML = filas.map(([k, v]) => `<dt>${k}</dt><dd>${String(v).replace(/[<>&]/g, "")}</dd>`).join("");
  }

  // ---------- controles 3D ----------
  function pintarLeyenda() {
    const ojo = estado.ojo, m = $("#sel-capa").value, esc = E.ojos[ojo].escalas[m];
    const cam = $("#btn-cam").classList.contains("activo");
    $("#visor-capa-desc").textContent = "Superficie anterior reconstruida · " + (cam ? "Grad-CAM sobre " + NOMBRE[m].toLowerCase() : DESC_CAPA[m]);
    const vals = esc.valores, asc = vals[vals.length - 1] > vals[0];
    const cols = asc ? esc.colores : esc.colores.slice().reverse();
    const lo = Math.min(vals[0], vals[vals.length - 1]), hi = Math.max(vals[0], vals[vals.length - 1]);
    $("#leyenda-3d").innerHTML = cam
      ? `<b>Grad-CAM · ${NOMBRE[m]}</b><div class="grad" style="background:linear-gradient(90deg,#00007f,#0050ff,#00d5ff,#7dff7a,#ffe600,#ff4800,#800000)"></div><div class="ext"><span>no influyó</span><span>más influyó</span></div>`
      : `<b>${NOMBRE[m]} (${UNIDAD[m]})</b><div class="grad" style="background:linear-gradient(90deg,${cols.join(",")})"></div><div class="ext"><span>${fmt(lo, m === "Axial" ? 1 : 0)}</span><span>${fmt(hi, m === "Axial" ? 1 : 0)}</span></div>`;
    $("#leyenda-3d").insertAdjacentHTML("beforeend", RELIEVE_HTML);
    if (!cam && $("#btn-valores").classList.contains("activo"))
      $("#leyenda-3d").insertAdjacentHTML("beforeend", '<div class="nota-valores">Valores cada 1 mm, leídos de la escala de color del mapa (aprox.)</div>');
  }
  // la elevación real (±75 µm sobre una córnea de 9 mm) no se vería: el relieve va exagerado con un factor FIJO
  const RELIEVE_HTML = `<div class="relieve" title="La elevación respecto de la esfera de mejor ajuste es de decenas de micras: a escala real no se vería. La curvatura de base (esfera de mejor ajuste) es la real.">Relieve <span class="largo">exagerado </span><span class="num">×${(window.CorneaVisor && CorneaVisor.EXAGERACION) || 8}</span><span class="largo"> para hacerlo visible</span></div>`;
  $("#sel-capa").addEventListener("change", (e) => { if (visorRes) visorRes.setCapa(e.target.value); pintarLeyenda(); });
  const alternar = (btn, fn) => btn.addEventListener("click", () => {
    const on = !btn.classList.contains("activo");
    btn.classList.toggle("activo", on); btn.setAttribute("aria-pressed", on);
    fn(on);
  });
  alternar($("#btn-cam"), (on) => { if (visorRes) visorRes.setGradcam(on); pintarLeyenda(); });
  alternar($("#btn-valores"), (on) => { if (visorRes) visorRes.setValoresImpresos(on); pintarLeyenda(); });
  alternar($("#btn-rotar"), (on) => { if (visorRes) visorRes.setAutoRotar(on); });
  $$("[data-vista]").forEach((b) => b.addEventListener("click", () => visorRes && visorRes.vista(b.dataset.vista)));

  function lectura(l) {
    const el = $("#lectura-3d");
    if (!l) { el.classList.add("oculto"); return; }
    el.classList.remove("oculto");
    el.style.left = Math.min(l.x, $("#res-3d").clientWidth - 200) + "px";
    el.style.top = (l.y + 60) + "px";
    const v = l.val;
    el.innerHTML = `<div class="pos">x ${fmt(l.xmm, 2)} · y ${fmt(l.ymm, 2)} mm · r ${fmt(Math.hypot(l.xmm, l.ymm), 2)}</div>
      Curvatura <b>${fmt(v.Axial)} D</b><br>Elev. anterior <b>${v.Anterior > 0 ? "+" : ""}${fmt(v.Anterior, 0)} µm</b><br>
      Paquimetría <b>${fmt(v.Pachymetry, 0)} µm</b><br>Elev. posterior <b>${v.Posterior > 0 ? "+" : ""}${fmt(v.Posterior, 0)} µm</b>`;
  }

  // ---------- informe / nuevo ----------
  $("#btn-informe").addEventListener("click", () => {
    if (visorRes) { const img = $("#captura-3d"); img.src = visorRes.captura(); img.classList.remove("oculto"); }
    const hoy = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
    $("#cab-impresion").innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #2c6aa0;padding-bottom:8px;margin-bottom:12px">
      <b style="letter-spacing:.16em;color:#0d2742">KERALYTIX · Informe de asistencia diagnóstica (demo)</b><span>${hoy}</span></div>`;
    window.print();
  });
  window.addEventListener("afterprint", () => $("#captura-3d").classList.add("oculto"));
  $("#btn-nuevo").addEventListener("click", () => {
    estado.archivos = {}; estado.vistaIniciada = false;
    pintarArchivos(); mostrarError("");
    $("#titulo-analisis").textContent = "Nuevo análisis";
    $("#sub-analisis").textContent = "Subí el PDF del estudio corneal de uno o ambos ojos.";
    $("#proc-barra").style.width = "0"; $("#proc-pct").textContent = "0 %";
    etapa("carga");
    window.scrollTo({ top: 0 });
  });

  // ------------------------------------------------------------------ arranque
  if (!E || !R) {
    document.body.insertAdjacentHTML("afterbegin", '<div class="error-carga" style="margin:16px">Faltan assets/datos_estudio.js o assets/resultados_demo.js. Ejecutá _herramientas/preparar_assets.py.</div>');
    return;
  }
  if (!window.THREE) console.warn("Three.js no cargó (¿sin conexión?): la vista 3D queda deshabilitada.");
  iniciarHero();
  irA(location.hash.startsWith("#/analisis") ? "analisis" : "inicio", false);
  if (R.fuente !== "colab") console.info("KERALYTIX demo: resultados PLACEHOLDER. Correr colab/celda_inferencia_demo.py y descomprimir el zip en web_demo/.");
})();
