"""
Prepara todos los recursos estáticos de la demo web de KERALYTIX a partir de los PDF Pentacam originales.

Uso (desde cualquier carpeta):
    python preparar_assets.py  [--origen RUTA/datos_demo]  [--anonimizados RUTA/datos_demo/anonimizados]

Por defecto busca una carpeta datos_demo/ subiendo desde web_demo/ (fuera del repo publicado).
Si están los PDF originales (1_2.pdf, 1_3.pdf), los anonimiza y escribe en --anonimizados:
  estudio_OD_anonimizado.pdf, estudio_OS_anonimizado.pdf   PDF sin apellido, nombre, ID/DNI, fecha de nacimiento,
                                                            fecha y hora de examen
Si no están, saca los mapas de esos PDF anonimizados (no los reescribe).
Ningún PDF se guarda dentro de web_demo/: la web publicada no los necesita y no deben poder descargarse.

Genera, dentro de web_demo/:
  assets/mapas/{OD,OS}_{Axial,Anterior,Pachymetry,Posterior}.png    los 4 mapas de la página 3 (560 x 560)
  colab/mapas_demo/                                                  copia de esos 8 PNG para la celda de Colab
  assets/datos_estudio.js                                            grillas 64x64 decodificadas desde la escala de
                                                                     color, puntos clave y valores del estudio
  assets/gradcam/*.png + assets/resultados_demo.js                   SOLO si no existen: placeholders hasta correr
                                                                     colab/celda_inferencia_demo.py

Los PDF originales NO se copian a web_demo/ (tienen datos personales). Requiere: pymupdf, pillow, numpy, scipy,
opencv-python-headless.
"""
import argparse
import base64
import hashlib
import io
import json
from pathlib import Path

import cv2
import numpy as np
import pymupdf
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree

WEB = Path(__file__).resolve().parents[1]
MAPAS = ["Axial", "Anterior", "Pachymetry", "Posterior"]
ARCHIVOS = {"OD": "1_2.pdf", "OS": "1_3.pdf"}
NEGRO = (28, 28, 28)

# ----------------------------------------------------------------------------------------------------------
# 1) Anonimización (las páginas son JPEG escaneados de 1200 x 838: se tapa sobre la imagen, no queda texto)
# ----------------------------------------------------------------------------------------------------------
# campos de la página 3 (todas las demás se buscan por coincidencia de plantilla con estos textos)
CAMPOS_P3 = {"apellido": (112, 51, 310, 67), "nombre": (112, 74, 310, 90), "id": (112, 97, 310, 113),
             "fnac": (112, 120, 203, 136), "fexam": (112, 143, 203, 159), "hora": (251, 143, 310, 159)}
# página 12 (Belin ABCD Progression): tipografía más grande, campos fijos + fechas de la tabla A-D
CAMPOS_P12 = [(86, 49, 245, 77), (314, 49, 464, 77), (542, 49, 712, 77)]
FECHA_P12 = (105, 410, 200, 432)


def recortar_texto(g, caja, umbral=130):
    x0, y0, x1, y1 = caja
    ys, xs = np.nonzero(g[y0:y1, x0:x1] < umbral)
    return g[y0 + ys.min() - 1:y0 + ys.max() + 2, x0 + xs.min() - 1:x0 + xs.max() + 2]


def anonimizar_pagina(img, plantillas, n_pag):
    g = np.asarray(img.convert("L"))
    dib = ImageDraw.Draw(img)
    if n_pag == 12:
        t = recortar_texto(g, FECHA_P12, 110)
        res = cv2.matchTemplate(g, t, cv2.TM_CCOEFF_NORMED)
        hits = []
        for y, x in zip(*np.nonzero(res > 0.6)):
            if all(abs(x - a) > 10 or abs(y - b) > 6 for a, b in hits):
                hits.append((x, y))
        for x, y in hits:
            dib.rectangle((x - 3, y - 3, x + t.shape[1] + 3, y + t.shape[0] + 3), fill=NEGRO)
        for c in CAMPOS_P12:
            dib.rectangle(c, fill=NEGRO)
        return len(hits) + len(CAMPOS_P12)
    lab, _ = ndimage.label(g > 240)
    cand = []
    for k, t in plantillas.items():
        for s in np.arange(0.55, 1.65, 0.05):
            tt = cv2.resize(t, None, fx=s, fy=s, interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
            if tt.shape[1] < 8:
                continue
            res = cv2.matchTemplate(g, tt, cv2.TM_CCOEFF_NORMED)
            for y, x in zip(*np.nonzero(res > 0.9)):
                cand.append((float(res[y, x]), int(x), int(y), int(x + tt.shape[1]), int(y + tt.shape[0])))
    cand.sort(reverse=True)
    elegidas = []
    for b in cand:
        if all(not (b[1] < e[3] and e[1] < b[3] and b[2] < e[4] and e[2] < b[4]) for e in elegidas):
            elegidas.append(b)
    for _, x0, y0, x1, y1 in elegidas:
        rect = (x0 - 2, y0 - 2, x1 + 2, y1 + 2)
        zona = lab[max(0, y0 - 3):y1 + 3, max(0, x0 - 3):x1 + 3]
        ids, cnt = np.unique(zona[zona > 0], return_counts=True)
        if len(ids):  # se tapa el campo blanco completo que contiene el texto
            sl = ndimage.find_objects((lab == ids[cnt.argmax()]).astype(int))[0]
            fx0, fy0, fx1, fy1 = sl[1].start, sl[0].start, sl[1].stop, sl[0].stop
            if fy1 - fy0 <= 3 * (y1 - y0) + 8 and fx1 - fx0 <= 6 * (x1 - x0) + 40:
                rect = (min(rect[0], fx0), min(rect[1], fy0), max(rect[2], fx1), max(rect[3], fy1))
        dib.rectangle(rect, fill=NEGRO)
    return len(elegidas)


def verificar(paginas, plantillas):
    """Máxima similitud que queda con cualquier dato personal (debe ser < 0.8)."""
    peor = 0.0
    for i, im in enumerate(paginas, start=1):
        if i == 12:
            continue
        g = np.asarray(im.convert("L"))
        for t in plantillas.values():
            for s in np.arange(0.55, 1.65, 0.05):
                tt = cv2.resize(t, None, fx=s, fy=s)
                if tt.shape[1] >= 8:
                    peor = max(peor, float(cv2.matchTemplate(g, tt, cv2.TM_CCOEFF_NORMED).max()))
    return peor


def anonimizar_pdf(src, dst):
    doc = pymupdf.open(src)
    paginas = [Image.open(io.BytesIO(doc.extract_image(p.get_images()[0][0])["image"])).convert("RGB") for p in doc]
    plantillas = {k: recortar_texto(np.asarray(paginas[2].convert("L")), c) for k, c in CAMPOS_P3.items()}
    originales = [p.copy() for p in paginas]
    for i, im in enumerate(paginas, start=1):
        n = anonimizar_pagina(im, plantillas, i)
        assert n >= 6, f"{src.name} página {i}: solo se encontraron {n} campos personales"
    peor = verificar(paginas, plantillas)
    assert peor < 0.8, f"{src.name}: quedan restos de datos personales (similitud {peor:.2f})"
    out = pymupdf.open()
    for p, im in zip(doc, paginas):
        pg = out.new_page(width=p.rect.width, height=p.rect.height)
        b = io.BytesIO()
        im.save(b, "JPEG", quality=90)
        pg.insert_image(pg.rect, stream=b.getvalue())
    out.set_metadata({"title": "Estudio Pentacam anonimizado - demo KERALYTIX", "author": "", "subject": "",
                      "keywords": "", "creator": "KERALYTIX demo", "producer": "pymupdf"})
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, garbage=4, deflate=True)
    print(f"  {dst.name}: 12 páginas anonimizadas (similitud residual máx {peor:.2f})")
    return originales[2]  # página 3 original (para los mapas, que no tienen datos personales)


def pagina3_anonimizada(pdf):
    """Página 3 de un PDF ya anonimizado (los mapas no tienen datos personales, solo se taparon los campos)."""
    doc = pymupdf.open(pdf)
    return Image.open(io.BytesIO(doc.extract_image(doc[2].get_images()[0][0])["image"])).convert("RGB")


# ----------------------------------------------------------------------------------------------------------
# 2) Mapas de la página 3 y decodificación de la escala de color
# ----------------------------------------------------------------------------------------------------------
# centro del círculo de cada mapa (cruz) y del recorte, en px de la página 3
CENTRO = {"Axial": (593, 252), "Anterior": (969, 252), "Pachymetry": (593, 630), "Posterior": (969, 630)}
RECORTE = {"Axial": (593, 259), "Anterior": (969, 259), "Pachymetry": (593, 637), "Posterior": (969, 637)}
LIMITES_X = {"Axial": (425, 761), "Pachymetry": (425, 761), "Anterior": (796, 1134), "Posterior": (796, 1134)}
H, R_PX, N = 176, 146, 64          # medio lado del recorte, radio del círculo (px) y lado de la grilla
R_MM = 4.5                          # el círculo es la zona de 9 mm de diámetro
BARRAS = {"Axial": (342, (97, 383)), "Anterior": (1142, (97, 383)),
          "Pachymetry": (342, (477, 763)), "Posterior": (1142, (477, 763))}
ESCALAS = {"OD": {"Axial": (79.5, 64.5), "Pachymetry": (260, 560)},
           "OS": {"Axial": (56.5, 41.5), "Pachymetry": (340, 640)}}       # valor arriba / abajo de la barra


def recortar_mapa(pag, m):
    cx, cy = RECORTE[m]
    a = np.asarray(pag.crop((cx - H, cy - H, cx + H, cy + H))).copy()
    fondo = a[60, 8].copy()
    x0, x1 = LIMITES_X[m]
    a[:, :max(0, x0 - (cx - H))] = fondo
    a[:, x1 - (cx - H):] = fondo
    return Image.fromarray(a).resize((560, 560), Image.LANCZOS)


def decodificar(pag, ojo, m):
    page = np.asarray(pag).astype(float)
    x, (y0, y1) = BARRAS[m]
    ys = np.linspace(y0, y1, 16).round().astype(int)
    cols = np.array([np.median(page[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3), 0) for y in ys])
    v0, v1 = ESCALAS[ojo].get(m, (-75, 75))
    t = np.linspace(0, 15, 15 * 24 + 1)
    lut = np.stack([np.interp(t, np.arange(16), cols[:, c]) for c in range(3)], 1)
    lutv = np.interp(t, np.arange(16), np.linspace(v0, v1, 16))
    cx, cy = CENTRO[m]
    parche = page[cy - R_PX - 2:cy + R_PX + 3, cx - R_PX - 2:cx + R_PX + 3]
    d, idx = cKDTree(lut).query(parche.reshape(-1, 3))
    denso = lutv[idx].reshape(parche.shape[:2])
    denso[(d > 38).reshape(parche.shape[:2])] = np.nan        # texto, puntos, grilla
    g = np.linspace(-1, 1, N)
    XX, YY = np.meshgrid(g, -g)
    dentro = XX ** 2 + YY ** 2 <= 1
    val = np.full((N, N), np.nan)
    for i in range(N):
        for j in range(N):
            if dentro[i, j]:
                yy = int(round(-YY[i, j] * R_PX)) + R_PX + 2
                xx = int(round(XX[i, j] * R_PX)) + R_PX + 2
                w = denso[max(0, yy - 3):yy + 4, max(0, xx - 3):xx + 4]
                w = w[np.isfinite(w)]
                if len(w) >= 5:
                    val[i, j] = np.median(w)
    ok = np.isfinite(val)
    v = np.where(ok, val, 0.0)
    for s in (1.0, 2.0, 4.0):                                  # relleno de huecos (convolución normalizada)
        num = ndimage.gaussian_filter(v * ok, s)
        den = ndimage.gaussian_filter(ok.astype(float), s)
        v = np.where(ok, v, np.where(den > 1e-3, num / np.maximum(den, 1e-6), 0))
        ok = ok | (den > 1e-3)
    escala = {"colores": ["#%02x%02x%02x" % tuple(int(round(x)) for x in col) for col in cols],
              "valores": [round(float(x), 2) for x in np.linspace(v0, v1, 16)]}
    return np.where(dentro, v, np.nan), escala


def entrada_colab(im):
    """Copia para el modelo: fuera del círculo del mapa todo blanco (sin título, lupa, 'OD', ejes ni T/N),
    más parecido a las imágenes Orbscan del entrenamiento. La alineación con el Grad-CAM no cambia."""
    a = np.asarray(im).copy()
    cy = (CENTRO["Axial"][1] - (RECORTE["Axial"][1] - H)) * 560 / (2 * H)
    r = R_PX * 560 / (2 * H) * 1.02
    yy, xx = np.mgrid[:560, :560]
    a[(xx - 280) ** 2 + (yy - cy) ** 2 > r ** 2] = 255
    return Image.fromarray(a)


def data_uri(im, fmt="JPEG"):
    b = io.BytesIO()
    if fmt == "JPEG":
        im.convert("RGB").save(b, "JPEG", quality=88)
        return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


# valores leídos de los propios PDF (página 3, Topometric/KC-Staging y Belin/Ambrósio). Coordenadas en mm,
# x hacia la derecha de la imagen e y hacia arriba, tal como las imprime el Pentacam.
CLINICO = {
    "OD": dict(K1=79.6, K2=87.4, Km=83.3, Kmax=104.4, Kmax_xy=(0.12, 0.41), astig=7.8, Q=-1.88, Rf=4.24,
               paq_fina=227, paq_fina_xy=(-0.88, -2.51), paq_apice=363, paq_pupila=389, BFS_ant=5.14, BFS_post=4.68,
               abcd="A3 B4 C4", BAD_D=16.75, ISV=216, KI=1.69, volumen=54.7, tkc="KC 4"),
    "OS": dict(K1=50.0, K2=50.5, Km=50.2, Kmax=56.0, Kmax_xy=(0.19, -2.67), astig=0.4, Q=-0.81, Rf=6.75,
               paq_fina=420, paq_fina_xy=(0.06, 0.99), paq_apice=430, paq_pupila=438, BFS_ant=6.88, BFS_post=5.76,
               abcd="A2 B2 C3", BAD_D=None, ISV=71, KI=1.13, volumen=54.5, tkc="KC 2"),
}


def placeholder_gradcam(v, m):
    """Mapa de 'atención' ilustrativo (NO es Grad-CAM real): zonas anómalas de cada mapa."""
    a = np.nan_to_num(v, nan=np.nanmedian(v))
    z = (a - np.nanmedian(v)) / (np.nanstd(v) + 1e-6)
    z = -z if m == "Pachymetry" else (np.abs(z) if m in ("Anterior", "Posterior") else z)
    g = np.linspace(-1, 1, N)
    XX, YY = np.meshgrid(g, -g)
    z = z * np.exp(-(XX ** 2 + YY ** 2) / 1.2)               # el centro pesa un poco más
    z = ndimage.gaussian_filter(np.clip(z, 0, None), 3)
    return z / (z.max() + 1e-8)


def cam_a_png(cam, ruta):
    """cam (N x N sobre el círculo) -> PNG RGBA 560 x 560 alineado con el recorte del mapa (colormap jet)."""
    import matplotlib
    lado = int(round(2 * R_PX * 560 / (2 * H)))
    c = np.asarray(Image.fromarray(np.uint8(255 * np.clip(cam, 0, 1))).resize((lado, lado), Image.BICUBIC)) / 255
    lienzo = np.zeros((560, 560))
    ox = int(round(280 - lado / 2))
    oy = int(round((CENTRO["Axial"][1] - (RECORTE["Axial"][1] - H)) * 560 / (2 * H) - lado / 2))
    lienzo[oy:oy + lado, ox:ox + lado] = c
    rgba = matplotlib.colormaps["jet"](lienzo)
    rgba[..., 3] = np.clip(lienzo ** 0.9 * 0.85, 0, 0.85)
    im = Image.fromarray(np.uint8(rgba * 255))
    im.save(ruta, optimize=True)
    return im


def buscar_datos_demo():
    """Primera carpeta datos_demo/ encontrada subiendo desde web_demo/ (sirve dentro y fuera del repo)."""
    for d in WEB.parents:
        if (d / "datos_demo").is_dir():
            return d / "datos_demo"
    return WEB.parent / "datos_demo"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--origen", default=None, help="carpeta con 1_2.pdf y 1_3.pdf originales")
    ap.add_argument("--anonimizados", default=None, help="carpeta de los PDF anonimizados (fuera de web_demo/)")
    args = ap.parse_args()
    origen = Path(args.origen) if args.origen else buscar_datos_demo()
    anon = Path(args.anonimizados) if args.anonimizados else origen / "anonimizados"
    (WEB / "assets" / "mapas").mkdir(parents=True, exist_ok=True)
    (WEB / "colab" / "mapas_demo").mkdir(parents=True, exist_ok=True)
    (WEB / "assets" / "gradcam").mkdir(parents=True, exist_ok=True)

    print("1) Anonimizando PDF")
    datos = {"mapas": MAPAS, "grilla": N, "radio_mm": R_MM,
             "circulo": {"cx": 0.5, "cy": round((CENTRO["Axial"][1] - (RECORTE["Axial"][1] - H)) / (2 * H), 4),
                         "r": round(R_PX / (2 * H), 4)},
             "ojos": {}, "pdf": {}}
    paginas3 = {}
    hay_originales = all((origen / n).exists() for n in ARCHIVOS.values())
    if not hay_originales:
        print(f"  No están los originales en {origen}: se usan los PDF ya anonimizados de {anon} (no se reescriben)")
    for ojo, nombre in ARCHIVOS.items():
        dst = anon / f"estudio_{ojo}_anonimizado.pdf"
        if hay_originales:
            paginas3[ojo] = anonimizar_pdf(origen / nombre, dst)
        else:
            paginas3[ojo] = pagina3_anonimizada(dst)
        datos["pdf"][ojo] = {"archivo": dst.name, "sha256": hashlib.sha256(dst.read_bytes()).hexdigest(),
                             "bytes": dst.stat().st_size, "paginas": 12}

    print("2) Recortando y decodificando los 4 mapas de la página 3")
    hay_colab = (WEB / "assets" / "resultados_demo.js").exists() and \
        '"fuente": "colab"' in (WEB / "assets" / "resultados_demo.js").read_text(encoding="utf-8")
    cams = {}
    for ojo, pag in paginas3.items():
        d = {"clinico": CLINICO[ojo], "grillas": {}, "rangos": {}, "escalas": {}, "img": {}}
        for m in MAPAS:
            im = recortar_mapa(pag, m)
            im.save(WEB / "assets" / "mapas" / f"{ojo}_{m}.png", optimize=True)
            entrada_colab(im).save(WEB / "colab" / "mapas_demo" / f"{ojo}_{m}.png")
            v, d["escalas"][m] = decodificar(pag, ojo, m)
            d["img"][m] = data_uri(im)
            d["grillas"][m] = [[None if not np.isfinite(x) else round(float(x), 1) for x in fila] for fila in v]
            d["rangos"][m] = [round(float(np.nanmin(v)), 1), round(float(np.nanmax(v)), 1)]
            if not hay_colab:
                cams.setdefault(ojo, {})[m] = data_uri(
                    cam_a_png(placeholder_gradcam(v, m), WEB / "assets" / "gradcam" / f"{ojo}_{m}.png"), "PNG")
        datos["ojos"][ojo] = d
        print(f"  {ojo}: rangos {d['rangos']}")
    js = "// Generado por _herramientas/preparar_assets.py. No editar a mano.\nwindow.KERALYTIX_ESTUDIO = " + \
         json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (WEB / "assets" / "datos_estudio.js").write_text(js, encoding="utf-8")

    if not hay_colab:
        print("3) Sin resultados de Colab: se escriben resultados PLACEHOLDER (reemplazar con la celda de Colab)")
        placeholder = {
            "fuente": "placeholder",
            "generado": None,
            "modelo": {"nombre": "pendiente (correr colab/celda_inferencia_demo.py)", "backbone": "-",
                       "experimentos": {}, "tau_fusion": 0.5, "auc_oof": None, "sens_test": None, "esp_test": None},
            "ojos": {
                "OD": {"prob": 0.97, "tau": 0.5, "pred": 1,
                       "mapas": {"Axial": {"prob": 0.98, "tau": 0.5}, "Anterior": {"prob": 0.95, "tau": 0.5},
                                 "Pachymetry": {"prob": 0.97, "tau": 0.5}, "Posterior": {"prob": 0.96, "tau": 0.5}}},
                "OS": {"prob": 0.81, "tau": 0.5, "pred": 1,
                       "mapas": {"Axial": {"prob": 0.88, "tau": 0.5}, "Anterior": {"prob": 0.74, "tau": 0.5},
                                 "Pachymetry": {"prob": 0.79, "tau": 0.5}, "Posterior": {"prob": 0.83, "tau": 0.5}}},
            },
        }
        for ojo in cams:
            placeholder["ojos"][ojo]["gradcam"] = cams[ojo]
        js = "// PLACEHOLDER: reemplazar por el archivo que genera colab/celda_inferencia_demo.py\n" \
             "window.KERALYTIX_RESULTADOS = " + json.dumps(placeholder, ensure_ascii=False, indent=1) + ";\n"
        (WEB / "assets" / "resultados_demo.js").write_text(js, encoding="utf-8")
    else:
        print("3) Hay resultados de Colab en assets/: no se tocan ni los resultados ni los Grad-CAM")
    print("listo:", WEB)


if __name__ == "__main__":
    main()
