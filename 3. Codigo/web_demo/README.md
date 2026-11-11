# KERALYTIX: demo web

Web de presentación del proyecto y demo del flujo que tendrá la aplicación: carga del PDF del topógrafo, análisis,
resultado con explicabilidad (Grad-CAM) y reconstrucción 3D de la córnea. Funciona en PC y en celular.

> En la demo **no se consulta ningún modelo en vivo**. El PDF solo dispara el flujo. Los 4 mapas de la página 3
> y los resultados del modelo ya están guardados en `assets/`, y los tiempos de carga son artificiales.

## Cómo abrirla

- Con doble clic en `index.html`. No hace falta servidor ni internet: Three.js y las fuentes están en `vendor/`.
- Con un servidor local:

  ```bash
  python -m http.server 8765 --directory web_demo
  ```

  y abrir http://localhost:8765
- Se puede publicar tal cual en GitHub Pages.

En **Empezá ya** solo se analizan los dos estudios de ejemplo, con el botón *Usar los dos estudios de ejemplo*.
La demo está pensada para publicarse, así que cualquier PDF que suba el visitante se "verifica" durante unos segundos y
se rechaza por formato. Su contenido nunca se lee y el archivo no sale del navegador. Los estudios de ejemplo no se
pueden descargar, y sus PDF **no** están en esta carpeta.

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html`, `css/`, `js/` | La web. `js/cornea3d.js` es el visor 3D y `js/app.js` maneja las vistas y la simulación. |
| `assets/datos_estudio.js` | Mapas de la pág. 3 (incrustados), grillas 64×64 decodificadas desde la escala de color, paletas y valores clínicos leídos del PDF. |
| `assets/resultados_demo.js` | Probabilidades por mapa y fusión, τ, datos del modelo y Grad-CAM (incrustado). **Hoy es un PLACEHOLDER.** |
| `assets/mapas/`, `assets/gradcam/` | Los mismos PNG sueltos, como referencia. |
| `colab/celda_inferencia_demo.py` | Celda para Colab que genera los resultados reales. |
| `colab/mapas_demo/` | Los 8 PNG de entrada del modelo: fuera del círculo todo blanco, más parecido a Orbscan. |
| `_herramientas/preparar_assets.py` | Regenera todo lo anterior desde los PDF originales. |
| `vendor/three/` | Three.js r147 (MIT): `three.min.js`, `OrbitControls.js`, `RoomEnvironment.js`. |
| `vendor/fuentes/` | Instrument Serif, Plus Jakarta Sans y JetBrains Mono (OFL), subconjuntos latin y latin-ext. |

La carpeta es **autocontenida**: no usa archivos de afuera ni recursos de internet.

Las imágenes van incrustadas como *data URI* porque WebGL no puede usar texturas de archivos locales cuando la página
se abre con `file://`.

## Resultados reales del modelo (pendiente)

1. En Colab, correr `02_Analisis_BackBone.ipynb` completo.
2. Pegar el contenido de `colab/celda_inferencia_demo.py` en una celda nueva al final y ejecutarla. Pide subir los
   8 PNG de `colab/mapas_demo/`.
3. Descomprimir `keralytix_demo_resultados.zip` **dentro de `web_demo/`**. Pisa `assets/resultados_demo.js` y
   `assets/gradcam/`.

La celda usa el backbone elegido en la Fase 5. Para cada mapa toma el experimento ganador entre "antes y después del
fine-tuning" y promedia los 5 folds. Para decidir, compara la fusión de los 4 mapas contra su τ calibrado en OOF. El
Grad-CAM explica la clase predicha y es el promedio de los folds. Cuando hay resultados reales, la web muestra
"inferencia real" en lugar de "ilustrativo".

⚠️ Los estudios de la demo son **Pentacam** y el modelo se entrena con **Orbscan**. Hay cambio de dominio, así que
los números muestran el flujo y no son una validación.

## Regenerar los assets

Requiere `pymupdf pillow numpy scipy opencv-python-headless matplotlib`.

```bash
python web_demo/_herramientas/preparar_assets.py
```

Los PDF viven **fuera** de `web_demo/`, en una carpeta `datos_demo/` que el script busca subiendo carpetas. También
se puede indicar con `--origen` y `--anonimizados`.

- Si están los originales (`datos_demo/1_2.pdf` = OD, `1_3.pdf` = OS), los anonimiza en `datos_demo/anonimizados/`
  (se taparon apellido, nombre, ID/DNI, fecha de nacimiento, fecha y hora de examen y las fechas de la tabla de la
  pág. 12, en las 12 páginas) y saca los mapas de ahí.
- Si no están, saca los mapas de `datos_demo/anonimizados/` y no reescribe esos PDF. Por la recompresión JPEG, las
  grillas pueden diferir entre 1 y 4 unidades.

Si `assets/resultados_demo.js` ya trae resultados de Colab, el script no lo pisa.

## Vista 3D

La superficie anterior es el casquete de la esfera de mejor ajuste del PDF (BFS anterior: 5,14 mm OD y 6,88 mm OS)
más la **elevación anterior decodificada del mapa** multiplicada por un factor **fijo ×8**, que se indica en el visor.
La curvatura de base es la real. La elevación es de unas decenas de micras (±75 µm) sobre una córnea de 9 mm, así
que a escala real el cono no se vería. El factor es fijo para que el usuario no pueda generar formas sin sentido. La
cámara se limita a 70° del eje óptico, así que nunca se ve la cara trasera. El giro automático rodea el eje óptico en
lugar de dar la vuelta completa. La cara posterior se
separa según la paquimetría decodificada. Los puntos marcados (K máx., punto más delgado) usan las coordenadas
impresas en el PDF; el ápice es el máximo de la elevación anterior. La zona del mapa mide 9 mm de diámetro.

El botón **Valores** muestra los valores del mapa activo cada 1 mm (cada 1,5 mm en el celular), como etiquetas que
siempre quedan de frente y no se deforman con la superficie. Se leen de la grilla decodificada de la escala de color,
así que son aproximados. Los números exactos de Pentacam están en las imágenes 2D del panel de mapas.
