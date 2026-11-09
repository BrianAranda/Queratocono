# La plantilla Beamer de la presentación

Cómo se armó `main.tex`, por qué se ve como se ve y cómo reutilizarla en otra presentación. Complementa a `Beamer_guia.md`, que explica Beamer en general. Esto explica **esta** plantilla en particular.

---

## 1. De dónde sale

**No usa ningún tema de Beamer.** Parte del tema por defecto, que es casi vacío, y todo lo visible está definido a mano en el preámbulo de `main.tex`, en unas 70 líneas.

Por qué no un tema como `Madrid`, `Warsaw` o `metropolis`:
- **Son reconocibles.** Cualquiera que haya visto presentaciones académicas los identifica, y la presentación parece hecha con una plantilla.
- **Cargan mucho.** Barras de navegación, degradados, sombras y cajas de colores que compiten con el contenido.
- **Tienen que parecerse al informe.** El escrito usa Times, títulos con una línea debajo y tablas con encabezado gris. La presentación sigue la misma línea para que se lean como parte del mismo trabajo.

## 2. El criterio de diseño: sobrio y cuadrado

La idea es que parezca un documento de trabajo que se le presenta a una dirección, no una publicidad. Todo lo que no transmite información se sacó.

| Decisión | Cómo se hace | Por qué |
|---|---|---|
| **Cajas con esquinas rectas** | El estilo `caja` de TikZ no tiene `rounded corners` | Las esquinas redondeadas dan un aire más informal. Las rectas son coherentes con las tablas |
| **Bloques planos** | `\setbeamertemplate{blocks}[default]` | Sin sombras ni esquinas redondeadas. Con `[rounded]` además aparecían pequeños defectos en el borde |
| **Sin iconos de navegación** | `\setbeamertemplate{navigation symbols}{}` | Los botones que Beamer pone abajo a la derecha no se usan al proyectar |
| **Título con una línea fina** | Plantilla `frametitle` propia, con una regla de 0,6 pt | Igual que las secciones del informe. Sin barra de color de fondo |
| **Cuatro colores, nada más** | `azul`, `verde`, `gris` y `rojo` | Ver la sección 3 |
| **Tipografía con serifa** | `\usefonttheme{serif}` y `times` | La misma del informe |
| **Pie de página gris y chico** | Plantilla `footline` propia | Da contexto sin llamar la atención |
| **Sin animaciones** | No hay `\pause` ni overlays | En un oral te pueden pedir volver a una diapositiva, y es más cómodo si cada una muestra todo de una vez |
| **Portada y cierre sin pie** | `\begin{frame}[plain]` | Son diapositivas de marco, no de contenido |

## 3. Los colores

```latex
\definecolor{azul}{HTML}{2C6AA0}
\definecolor{verde}{HTML}{3E8E5E}
\definecolor{gris}{HTML}{F1F1F1}
\definecolor{rojo}{HTML}{B03A2E}
```

| Color | Dónde se usa | Qué significa |
|---|---|---|
| **azul** | Títulos, viñetas, bordes de cajas, encabezados de tablas y bloques | Es el color de la presentación. Sale del azul del logo de la UNaM |
| **verde** | La caja de Login miBA, la flecha "administra", la barra de seguimiento y "Conforme" | El sistema auditado y lo que está bien |
| **gris** | Fondo de los bloques y del triángulo de la diapositiva 2 | Fondo neutro para separar sin usar color |
| **rojo** | Solo "Observación" en la tabla de 2×2 de la evidencia | Lo que está mal. Se usa en un único lugar para que no pierda fuerza |

Si querés cambiar el tono de toda la presentación, alcanza con cambiar el código de `azul`.

## 4. El preámbulo, bloque por bloque

### Documento y paquetes

```latex
\documentclass[aspectratio=169, 11pt]{beamer}
```
Formato 16:9, que es el de los proyectores y pantallas actuales. La hoja mide 16 × 9 cm, así que 11 pt se ve grande proyectado.

| Paquete | Para qué |
|---|---|
| `inputenc`, `fontenc`, `babel` (spanish, es-tabla) | Acentos, español, y "Tabla" en lugar de "Cuadro" |
| `times` | La tipografía del informe |
| `tabularray` | Las tablas, con la misma sintaxis `tblr` que en el informe |
| `tikz` con `positioning`, `arrows.meta`, `calc`, `babel` | Diagramas. `babel` es imprescindible: sin ella, el español rompe las flechas `->` |
| `appendixnumberbeamer` | Las diapositivas de respaldo no suman al total del pie |

### Colores y tipografía de los elementos

```latex
\setbeamercolor{frametitle}{fg=azul}
\setbeamercolor{title}{fg=azul}
\setbeamercolor{structure}{fg=azul}
\setbeamercolor{block title}{bg=azul, fg=white}
\setbeamercolor{block body}{bg=gris}
\setbeamerfont{frametitle}{series=\bfseries, size=\Large}
\setbeamertemplate{itemize items}{\color{azul}\textbullet}
```
`structure` es el color base que Beamer usa para todo lo que no tiene uno propio, como las viñetas y los números de las listas. Poniéndolo en azul, todo queda coherente sin definir elemento por elemento.

Las viñetas son un punto simple (`\textbullet`). Beamer usa por defecto triángulos, que desentonan con el resto.

### Sangría de las listas

```latex
\setlength{\leftmargini}{1.2em}
\setlength{\leftmarginii}{1.2em}
```
Beamer deja 2em de sangría. Con 1.2em las listas aprovechan mejor el ancho. En Beamer no se usa `enumitem` ni `[leftmargin=*]`: rompe las listas propias de Beamer.

### Pie de página

```latex
\setbeamertemplate{footline}{%
    \leavevmode%
    \hbox{%
        \begin{beamercolorbox}[wd=0.35\paperwidth, ht=3ex, dp=1.2ex, left]{footline}%
            \hspace*{1em}Aranda, Brian Ezequiel%
        \end{beamercolorbox}%
        \begin{beamercolorbox}[wd=0.40\paperwidth, ht=3ex, dp=1.2ex, center]{footline}%
            Propuesta de auditoría - Login miBA%
        \end{beamercolorbox}%
        \begin{beamercolorbox}[wd=0.25\paperwidth, ht=3ex, dp=1.2ex, right]{footline}%
            \insertframenumber\,/\,\inserttotalframenumber\hspace*{1em}%
        \end{beamercolorbox}%
    }%
    \vskip0pt%
}
```
Tres cajas: autor a la izquierda, título corto al centro y número a la derecha. Los anchos suman exactamente el ancho de la hoja.

**Dos detalles que costaron:**
- **Cada línea termina en `%`.** Sin él, el salto de línea es un espacio, y ese espacio empujaba la caja fuera de la hoja. Por eso el "/16" aparecía cortado, con 37 advertencias al compilar.
- **`\hspace*` con asterisco.** Un `\hspace` común al final de un renglón se descarta.

### Título de cada diapositiva

```latex
\setbeamertemplate{frametitle}{%
    \vspace{0.4em}\insertframetitle\par\vspace{0.2em}{\color{azul}\hrule height 0.6pt}}
```
Título en azul y negrita con una línea fina debajo, sin fondo. Es la versión de diapositiva del formato de secciones del informe.

### Estilos de TikZ

```latex
\tikzset{
    caja/.style={draw=azul, fill=white, align=center, font=\small,
                 execute at begin node={\hyphenpenalty=10000},
                 inner sep=5pt, text width=#1},
    caja/.default=3cm,
    flecha/.style={-{Stealth[length=2.5mm]}, thick, azul}
}
```
Todos los diagramas se arman con estos dos estilos, así se ven iguales en toda la presentación.
- **`caja`**: borde azul, fondo blanco, texto centrado y chico. El ancho se pasa como parámetro, `caja=4.2cm`, y si no se pone, vale 3 cm. `\hyphenpenalty=10000` evita que las palabras se corten con guion dentro de la caja. Va en `execute at begin node`, porque puesto en `font=` imprimía texto basura.
- **`flecha`**: línea gruesa azul con punta tipo `Stealth`.

Para destacar una caja se le suma algo al usarla, sin crear estilos nuevos:
```latex
\node[caja=4.2cm, fill=azul!15, very thick] (dg) {...};   % el organismo auditado
\node[caja=4.2cm, draw=verde] (sis) {...};                 % el sistema
```

## 5. Los tipos de diapositiva

Todas las diapositivas son variaciones de cinco patrones. Para agregar una nueva, copiá la más parecida.

| Patrón | Estructura | Ejemplos |
|---|---|---|
| **Texto y figura** | `columns` con una lista a la izquierda y TikZ a la derecha | 2 (qué es esta auditoría), 3 (el sistema) |
| **Diagrama** | Una línea de texto, un TikZ centrado y una nota abajo | 4 (procesos), 5 (cronología), 11 (evidencia), 13 (cronograma) |
| **Tabla** | Un `tblr` centrado con una nota abajo | 6 (antecedente), 8 (procesos), 9 (equipo), 15 (entrevistas) |
| **Bloques** | `columns` con `block` en cada una | 7 (objetivo), 12 (DS5) |
| **Lista** | `itemize` y, a veces, un `block` abajo | 14 (qué necesitaríamos), 16 (qué va a recibir) |

### Formato común de las tablas

Todas usan la misma receta, así que se ven iguales:
```latex
\begin{tblr}{
    colspec = {Q[l,m,4cm] X[l,m]},                  % anchos: fijo y flexible
    row{1} = {bg=azul, fg=white, font=\bfseries},   % encabezado azul
    rows = {font=\small}, hlines={gray!50}, rowsep=3pt
}
```
Solo líneas horizontales grises, sin verticales, que es más limpio que una grilla completa. La excepción es la tabla de 2×2 de la diapositiva 11, que cruza dos criterios y por eso lleva también líneas verticales.

Si la tabla no entra, en este orden: bajar a `\footnotesize`, reducir `rowsep` y acortar el texto de las celdas, que es lo que más rinde.

## 6. Estructura del archivo

```
Presentacion/
├── main.tex             Preámbulo y todas las diapositivas
├── .latexmkrc           Compila a Presentacion.pdf, auxiliares en build/
├── img/Logo_UNaM.png    Copiado desde el informe
├── Presentacion.pdf
├── Guion.md             Qué decir en cada diapositiva
├── Guia_de_estudio.md   Teoría y preguntas
├── Beamer_guia.md       Beamer en general
├── Plantilla_beamer.md  Este archivo
└── Analisis_critico.md  Puntos débiles y respuestas
```

Dentro de `main.tex`, cada diapositiva va precedida por un comentario con su número, lo que facilita encontrarla:
```latex
% ===============================================================
% 12. Cronograma
% ===============================================================
```

Las diapositivas de respaldo van después de `\appendix`, al final del archivo.

Para compilar, desde `Presentacion/`:
```
latexmk main.tex
```
Antes, cerrá el PDF si lo tenés abierto en un visor que lo bloquee.

## 7. Cómo reutilizarla en otra presentación

1. Copiá la carpeta y borrá todo lo que está entre la portada y `\end{document}`.
2. Cambiá los datos de la portada (`\title`, `\subtitle`, `\author`, `\institute`, `\date`) y el título corto del pie, en la caja central de `footline`.
3. Si no es de la UNaM, cambiá el logo y el color `azul`.
4. Armá cada diapositiva copiando el patrón más parecido de la sección 5.
5. Compilá y revisá que diga **0 advertencias**. En Beamer, una advertencia de `Overfull` casi siempre es algo que se sale de la hoja aunque no se note a simple vista.

## 8. Historial de cambios de diseño

Qué se fue ajustando y por qué, para no volver a caer en lo mismo:

| Cambio | Motivo |
|---|---|
| Bloques de `[rounded]` a `[default]` | Dejaban una marca en la esquina y eran más informales |
| Cajas sin esquinas redondeadas | Decisión de estilo: más sobrio, coherente con las tablas |
| Pie de página reescrito en tres cajas | Se salía de la hoja por espacios sin `%` y cortaba el número |
| `\hyphenpenalty` movido a `execute at begin node` | En `font=` imprimía texto basura dentro de las cajas |
| `appendixnumberbeamer` | El total del pie contaba las diapositivas de respaldo |
| Sangría de listas en 1.2em | Mejor aprovechamiento del ancho |
| Escalas de TikZ ajustadas (0.88 cm en el cronograma) | Tres figuras se pasaban unos puntos del ancho |
