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
Sigue la plantilla de las presentaciones de IdS2 y PDS: colores, pie de página y macros en `config/formato.tex`.

## Estructura
| Archivo | Contenido |
|---|---|
| `main.tex` | Solo invoca la configuración y las partes, en orden |
| `config/packages.tex` | Paquetes |
| `config/formato.tex` | Colores, pie de página, título de cada diapositiva y macros |
| `config/datos.tex` | Título, autores, institución y fecha de la portada |
| `config/tikz.tex` | Estilos `caja` y `flecha` para los diagramas |
| `partes/` | `00-portada`, `01-proyecto`, `02-resultados`, `03-balance`, `04-final` y `anexo` (diapositivas de respaldo) |
| `img/` | Logos, figuras del EDA y esquemas TikZ, como el de parámetros corneales copiado del informe |
| `Guion/guion.md` | Qué decir en cada diapositiva y cuánto tiempo darle |
| `.latexmkrc` | Salida `Presentacion.pdf`, auxiliares en `build/` |

## Macros propias
- `\seccion{Título}`: ordena el archivo, sin diapositiva separadora.
- `\alcanzado{}`, `\enproceso{}`, `\porhacer{}`: estado del resultado al pie de la diapositiva.
- `\etiq{color}{texto}`: etiqueta de estado dentro de una tabla.
- `\idea{texto}`: caja gris con borde azul para la idea clave.
- `\pendiente{texto}`: marca en rojo de lo que falta. No debe quedar ninguna en la versión final.
- Entorno `tabla`: tabla con encabezado azul y líneas horizontales grises.
