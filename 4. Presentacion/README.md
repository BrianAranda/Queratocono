<!-- LTeX: enabled=false -->
# Presentación en Beamer

Esta carpeta está dedicada a los archivos LaTeX de las presentaciones para cada entrega.

¿Sabías que se pueden hacer presentaciones con LaTeX usando el entorno Beamer? Hay LaTeX para todo :)

## Compilar
Desde esta carpeta:
```
latexmk
```
El `.latexmkrc` ya indica el archivo principal (`main.tex`). Genera **`Presentacion.pdf`** junto al `.tex` y deja los auxiliares en `build/`. Antes de compilar, cerrar el PDF si el visor lo bloquea.

Criterio: **0 advertencias**. En Beamer, un `Overfull` casi siempre es algo que se sale de la hoja aunque no se note.

## Diseño
Sigue la plantilla de las presentaciones de IdS2 y PDS, explicada en `Plantilla_beamer.md`. `Beamer_guia.md` explica Beamer en general.

## Estructura
| Archivo | Contenido |
|---|---|
| `main.tex` | Datos y portada, orden de las secciones, cierre |
| `preambulo.tex` | Paquetes, colores, pie de página, macros |
| `.latexmkrc` | Salida `Presentacion.pdf`, auxiliares en `build/` |
| `secciones/` | Diapositivas de cada tema. `01_ejemplos.tex` tiene un molde de cada patrón y se borra cuando ya no haga falta |
| `tikz/estilos.tex` | Estilos `caja` y `flecha` para los diagramas |
| `img/` | Logos de la UNaM y de KERALYTIX, copiados del informe |

## Macros propias
- `\seccion{Título}`: diapositiva separadora, sin pie.
- `\idea{texto}`: caja gris con borde azul para la idea clave.
- `\pendiente{texto}`: marca en rojo de lo que falta. No debe quedar ninguna en la versión final.
- Entorno `tabla`: tabla con encabezado azul y líneas horizontales grises.
