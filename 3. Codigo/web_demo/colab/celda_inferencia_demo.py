# ======================================================================================================
# KERALYTIX — celda de inferencia para la DEMO WEB
# ------------------------------------------------------------------------------------------------------
# Pegar como ÚLTIMA celda de 02_Analisis_BackBone.ipynb y ejecutarla DESPUÉS de correr el notebook
# completo, en la misma sesión (usa MAPAS, BEST_BB, BEST_SIZE, RESULTADOS, cargar_clf, gradcam, etc.).
# No modifica nada del notebook: solo lee los checkpoints ya entrenados.
#
# Entrada : los 8 PNG de web_demo/colab/mapas_demo/  ({OD,OS}_{Axial,Anterior,Pachymetry,Posterior}.png)
#           -> se suben con el diálogo de archivos, o se dejan en DEMO_DIR (por ejemplo en Drive).
# Salida  : keralytix_demo_resultados.zip con
#             assets/resultados_demo.js     probabilidades por mapa y fusión, tau, modelo usado y Grad-CAM incrustado
#             assets/gradcam/{ojo}_{mapa}.png  Grad-CAM RGBA alineado con cada PNG de entrada
#           Descomprimir el zip DENTRO de web_demo/ (pisa los placeholders).
#
# Modelo: familia CNN del backbone elegido (Fase 5/6): para cada mapa se usa el experimento ganador de
# "antes / después del fine-tuning" (CAB_ o FT_), con el promedio de los 5 modelos de fold, como en test.
# La decisión del ojo es la FUSIÓN (promedio de los 4 mapas) contra el tau calibrado OOF de esa fusión.
# Grad-CAM: se explica la clase predicha por la fusión, promediando el CAM de los 5 folds.
# ⚠️ Los mapas de la demo son Pentacam y el modelo se entrenó con Orbscan: hay cambio de dominio, los números
#    son ilustrativos del flujo y no una validación.
# ======================================================================================================
import io, json, zipfile, datetime, base64
from pathlib import Path
import numpy as np
import matplotlib
from PIL import Image
import torch
import torchvision.transforms as T

DEMO_DIR = Path("/content/mapas_demo")          # o p. ej. Path("/content/drive/MyDrive/keralytix/mapas_demo")
OJOS = ["OD", "OS"]
LADO_WEB = 560                                    # tamaño de los PNG de la web

# ---------- 1) entrada ----------
nombres = [f"{o}_{m}.png" for o in OJOS for m in MAPAS]
if not all((DEMO_DIR / n).exists() for n in nombres):
    from google.colab import files
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    print("Subí los 8 PNG de web_demo/colab/mapas_demo/")
    for n, b in files.upload().items():
        (DEMO_DIR / Path(n).name).write_bytes(b)
faltan = [n for n in nombres if not (DEMO_DIR / n).exists()]
assert not faltan, f"faltan {faltan}"

# ---------- 2) qué experimento usar en cada mapa ----------
c = CORTO[BEST_BB]
pref_ganador = "FT" if str(MEJOR_FT_AB).startswith("FT") else "CAB"
EXP = {}
for m in MAPAS:
    eid = f"{pref_ganador}_{c}_{m}"
    if eid not in RESULTADOS or not all(ruta_ckpt(eid, k).exists() for k in FOLDS):
        eid = f"CAB_{c}_{m}"                       # mapa sin fine-tuning (MAPAS_FT recortado)
    EXP[m] = eid
eid_fus = f"{pref_ganador}_{c}_fusion"
if eid_fus not in RESULTADOS or RESULTADOS[eid_fus]["extra"].get("componentes") != [EXP[m] for m in MAPAS]:
    eid_fus = f"DEMO_{c}_fusion"
    RESULTADOS[eid_fus] = fusionar(eid_fus, [EXP[m] for m in MAPAS], "demo: fusión de los mapas usados",
                                   dict(backbone=BEST_BB, mapa="fusión"))
TAU_FUS = float(RESULTADOS[eid_fus]["oof"]["tau"])
print("backbone:", BEST_BB, f"({BEST_SIZE} px) | experimentos:", EXP, "| fusión:", eid_fus, f"tau={TAU_FUS:.3f}")


# ---------- 3) preprocesado idéntico al del notebook ----------
def preparar(ruta, ojo):
    im = Image.open(ruta).convert("RGB")
    if LIMPIAR_MARCAS:
        im = tapar_marcas(im)                       # mismo recuadro blanco sobre T/N que en el entrenamiento
    if ESPEJAR_OS and ojo == "OS":
        im = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    pre = int(round(BEST_SIZE * 1.07))
    return im.resize((pre, pre), Image.BILINEAR), pre


def cam_a_web(cam, pre, ojo):
    """CAM (resolución de features, sobre el CenterCrop) -> RGBA LADO_WEB x LADO_WEB alineado con el PNG original."""
    c = np.asarray(Image.fromarray(np.uint8(255 * np.clip(cam, 0, 1))).resize((BEST_SIZE, BEST_SIZE),
                                                                                Image.BILINEAR)) / 255
    lienzo = np.zeros((pre, pre))
    o = int(round((pre - BEST_SIZE) / 2.0))        # mismo desplazamiento que T.CenterCrop
    lienzo[o:o + BEST_SIZE, o:o + BEST_SIZE] = c
    lienzo = np.asarray(Image.fromarray(np.uint8(255 * lienzo)).resize((LADO_WEB, LADO_WEB), Image.BILINEAR)) / 255
    if ESPEJAR_OS and ojo == "OS":
        lienzo = lienzo[:, ::-1]
    rgba = matplotlib.colormaps["jet"](lienzo)
    rgba[..., 3] = np.clip(lienzo ** 0.9 * 0.85, 0, 0.85)
    b = io.BytesIO()
    Image.fromarray(np.uint8(rgba * 255)).save(b, "PNG", optimize=True)
    return b.getvalue()


# ---------- 4) probabilidades (promedio de folds) ----------
res = {o: {"mapas": {}} for o in OJOS}
entradas = {}
for m in MAPAS:
    modelos = [cargar_clf(BEST_BB, EXP[m], k) for k in FOLDS]
    tf_ev = build_tf(BEST_SIZE, False, modelos[0].mean, modelos[0].std)
    for o in OJOS:
        im, pre = preparar(DEMO_DIR / f"{o}_{m}.png", o)
        x = tf_ev(im).unsqueeze(0).to(DEVICE)
        entradas[(o, m)] = (x, pre)
        with torch.no_grad():
            p = float(np.mean([torch.sigmoid(md(x).float()).item() for md in modelos]))
        res[o]["mapas"][m] = {"prob": round(p, 4), "tau": round(float(RESULTADOS[EXP[m]]["oof"]["tau"]), 4),
                              "experimento": EXP[m]}
    liberar(*modelos)
    del modelos

for o in OJOS:
    p = float(np.mean([res[o]["mapas"][m]["prob"] for m in MAPAS]))
    res[o].update(prob=round(p, 4), tau=round(TAU_FUS, 4), pred=int(p >= TAU_FUS))
    print(f"{o}: P(QC) fusión = {p:.3f} (tau {TAU_FUS:.3f}) -> {'QUERATOCONO' if p >= TAU_FUS else 'sano'} | " +
          ", ".join(f"{m} {res[o]['mapas'][m]['prob']:.3f}" for m in MAPAS))

# ---------- 5) Grad-CAM de la clase predicha (promedio de folds) ----------
pngs = {}
for m in MAPAS:
    modelos = [cargar_clf(BEST_BB, EXP[m], k) for k in FOLDS]
    for o in OJOS:
        x, pre = entradas[(o, m)]
        cams = [gradcam(md, x, res[o]["pred"])[0] for md in modelos]
        cam = np.mean(cams, 0)
        cam = cam / (cam.max() + 1e-8)
        png = cam_a_web(cam, pre, o)
        pngs[f"assets/gradcam/{o}_{m}.png"] = png
        # la web lee el Grad-CAM incrustado (WebGL no puede usar imágenes locales abiertas con file://)
        res[o].setdefault("gradcam", {})[m] = "data:image/png;base64," + base64.b64encode(png).decode()
    liberar(*modelos)
    del modelos

# ---------- 6) exportar ----------
r_f = RESULTADOS[eid_fus]
salida = {
    "fuente": "colab",
    "generado": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
    "modelo": {"nombre": f"{c} — {'fine-tuning' if pref_ganador == 'FT' else 'transfer learning'} · fusión 4 mapas",
               "backbone": BEST_BB, "entrada_px": BEST_SIZE, "experimentos": EXP, "fusion": eid_fus,
               "tau_fusion": round(TAU_FUS, 4), "auc_oof": round(float(r_f["oof"]["auc"]), 3),
               "sens_test": round(float(r_f["test"]["sens"]), 3), "esp_test": round(float(r_f["test"]["esp"]), 3),
               "auc_test": round(float(r_f["test"]["auc"]), 3), "fraccion_datos": FRACCION_DATOS, "tag": TAG,
               "modelo_final_notebook": MEJOR},
    "ojos": res,
}
js = "// Generado por colab/celda_inferencia_demo.py — no editar a mano.\nwindow.KERALYTIX_RESULTADOS = " + \
     json.dumps(salida, ensure_ascii=False, indent=1) + ";\n"
zpath = Path("/content/keralytix_demo_resultados.zip")
with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("assets/resultados_demo.js", js)
    for n, b in pngs.items():
        z.writestr(n, b)
print(json.dumps(salida["modelo"], indent=1, ensure_ascii=False))
print(f"→ {zpath}  (descomprimir dentro de web_demo/)")
try:
    from google.colab import files
    files.download(str(zpath))
except Exception:
    pass
