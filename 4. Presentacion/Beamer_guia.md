# Beamer para quien ya sabe LaTeX

Beamer es una clase de documento, igual que `article`. Todo lo que ya sabés sigue valiendo: paquetes, macros, TikZ, tabularray, `\textbf`, listas. Lo nuevo son tres cosas: **el frame**, **las plantillas de estilo** y **los overlays**. Los ejemplos salen de tu `main.tex`.

Compilás igual que el informe: `latexmk main.tex` desde `Presentacion/`. El `.latexmkrc` deja el PDF como `Presentacion.pdf` y los auxiliares en `build/`.

---

## 1. La estructura

```latex
\documentclass[aspectratio=169, 11pt]{beamer}   % 16:9, como un proyector actual
% ... paquetes y estilo (el "preámbulo")
\begin{document}
\begin{frame}{Título de la diapositiva}
    contenido
\end{frame}
\end{document}
```

- **Cada diapositiva es un `frame`.** No hay páginas que se llenan solas: si el contenido no entra, se corta. No hay salto de página automático. Por eso hay que mirar el PDF después de cada cambio.
- El segundo argumento del frame es el título: `\begin{frame}{Qué es esta auditoría}`.
- `aspectratio=169` da una hoja de 16 × 9 cm. Es chica, y por eso el texto a 11 pt se ve grande proyectado.

### Opciones de frame que usás

| Opción | Qué hace | Dónde está |
|---|---|---|
| `[plain]` | Sin título ni pie de página | Portada y "¿Preguntas?" |
| `[t]` | Alinea el contenido arriba, en lugar de centrarlo | No lo usás, pero sirve si una diapositiva queda "flotando" |
| `[fragile]` | Necesario si adentro hay `verbatim` o `lstlisting` | No lo usás |

## 2. Organizar el contenido

### Columnas

Reemplazan a las minipage.

```latex
\begin{columns}[T]                     % [T] alinea las columnas por arriba
    \begin{column}{0.55\textwidth}
        texto
    \end{column}
    \begin{column}{0.42\textwidth}
        figura
    \end{column}
\end{columns}
```

Están en las diapositivas 2, 3, 7, 12 y 14.

### Bloques

Cajas con título. Hay tres variantes, que cambian de color según el tema.

```latex
\begin{block}{Qué se verifica}  ... \end{block}
\begin{alertblock}{Atención}    ... \end{alertblock}
\begin{exampleblock}{Ejemplo}   ... \end{exampleblock}
```

Los usás en las diapositivas 7, 12 y 15.

## 3. El estilo: temas y plantillas

Beamer trae temas completos (`\usetheme{Madrid}`, `\usetheme{metropolis}`, etc.). **No usé ninguno.** Partí del tema por defecto y lo ajusté a mano, para que se parezca al informe y no a una plantilla reconocible. Se hace con tres comandos:

| Comando | Para qué | Ejemplo en tu archivo |
|---|---|---|
| `\setbeamercolor{elemento}{fg=..., bg=...}` | Colores | `\setbeamercolor{frametitle}{fg=azul}` |
| `\setbeamerfont{elemento}{...}` | Tipografía | `\setbeamerfont{frametitle}{series=\bfseries, size=\Large}` |
| `\setbeamertemplate{elemento}{código}` | Cómo se dibuja algo | El pie de página y la línea bajo el título |

Los "elementos" tienen nombres fijos: `frametitle`, `footline`, `title`, `block title`, `itemize items`, `navigation symbols`, etc.

**Ejemplos concretos de tu archivo:**

- `\setbeamertemplate{navigation symbols}{}` borra los iconos de navegación que Beamer pone abajo a la derecha. Casi todo el mundo lo hace.
- `\setbeamertemplate{footline}{...}` arma el pie: tu nombre, el título corto y `\insertframenumber / \inserttotalframenumber`.
- Los colores `azul`, `verde`, `gris` y `rojo` están definidos arriba con `\definecolor`. **Si querés cambiar el azul de toda la presentación, se cambia en una sola línea.**

Los comandos `\insert...` devuelven datos del documento: `\inserttitle`, `\insertauthor`, `\insertframetitle`, `\insertframenumber`. Se usan dentro de las plantillas.

## 4. Overlays: que las cosas aparezcan de a una

Es lo más propio de Beamer. Un frame puede generar varias páginas en el PDF, y cada una muestra un poco más.

```latex
\begin{itemize}
    \item<1-> aparece desde la página 1
    \item<2-> aparece desde la 2
    \item<3-> aparece desde la 3
\end{itemize}
```

Atajos:

| Código | Efecto |
|---|---|
| `\pause` | Todo lo que sigue aparece en el siguiente clic |
| `\begin{itemize}[<+->]` | Cada ítem aparece en un clic distinto |
| `\only<2>{...}` | Solo en la página 2, y no ocupa lugar en las demás |
| `\uncover<2->{...}` | Ocupa lugar siempre, pero se ve desde la 2 |
| `\alert<2>{...}` | Resalta en rojo en la página 2 |

**Tu presentación no tiene overlays**, a propósito. En un oral con preguntas es más cómodo que cada diapositiva muestre todo, porque si te piden volver atrás no tenés que pasar clics. Si querés probar, un buen lugar es la diapositiva 11, para que la tabla de 2×2 aparezca después del circuito:

```latex
\pause
\begin{tblr}{ ... }
```

Ojo: el PDF pasa a tener más páginas, pero el número de diapositiva del pie no cambia, porque cuenta frames y no páginas.

## 5. TikZ dentro de Beamer

Funciona igual que en el informe. Dos detalles:

- **`\usetikzlibrary{babel}`** está en el preámbulo porque el español de babel convierte `<` y `>` en atajos, y eso rompe las flechas de TikZ (`->`). Esa librería lo resuelve. En el informe no te pasó porque no usabas flechas.
- Los estilos `caja` y `flecha` están definidos una sola vez con `\tikzset` en el preámbulo y se usan en varias diapositivas. Si cambiás el estilo `caja`, cambian todas las cajas.

## 6. Las diapositivas de respaldo

```latex
\appendix
\begin{frame}{Respaldo: auditoría y peritaje} ... \end{frame}
```

`\appendix` separa las diapositivas finales, y el paquete `appendixnumberbeamer` hace que no sumen al total. Por eso el pie dice "16 / 17" y no "16 / 21". Las de respaldo se numeran aparte (1/4 a 4/4).

Para saltar a una de respaldo durante el oral: en el visor de PDF escribís el número de página y Enter. Las de respaldo son las páginas 18 a 21: programa de auditoría (18), COBIT 4.1 y 2019 (19), auditoría y peritaje (20) y control interno y auditorías (21).

## 7. Recetas rápidas

**Agregar una diapositiva:** copiá un bloque `\begin{frame}...\end{frame}` completo y cambiá el título y el contenido.

**Achicar el texto de una diapositiva que no entra:** usá `\small` o `\footnotesize` dentro del frame, o `\begin{frame}[shrink=10]`, que achica todo un 10 % (conviene como último recurso).

**Notas del orador:** Beamer permite escribir notas con `\note{...}` dentro de cada frame y mostrarlas en una segunda pantalla con `pdfpc`. Si querés, paso el guion a notas, pero requiere que el aula tenga dos pantallas configuradas. Imprimir el guion es más seguro.

**Versión para imprimir:** `\documentclass[handout, aspectratio=169]{beamer}` junta los overlays en una sola página por frame. Como no tenés overlays, hoy no cambia nada.

## 8. Errores comunes

| Error | Causa probable |
|---|---|
| El contenido se sale por abajo sin avisar | Beamer no pasa a otra página: hay que achicar o partir el frame |
| `Missing \begin{document}` con verbatim | Falta `[fragile]` en el frame |
| Flechas de TikZ rotas | Falta `\usetikzlibrary{babel}` |
| Texto raro dentro de un nodo de TikZ | Un comando puesto en la opción `font=` que no es de fuente. Pasó con `\hyphenpenalty`: va en `execute at begin node` |
| `Overfull \hbox` en todas las diapositivas y el pie cortado | Dentro de una plantilla, un salto de línea sin `%` es un espacio. Si la caja ya mide `\paperwidth`, ese espacio la empuja fuera de la hoja. Cada línea de una plantilla termina en `%` |
| El espacio al final de una caja desaparece | `\hspace{1em}` al final de un renglón se descarta. Para que se mantenga, usá `\hspace*{1em}` |
| `Overfull \hbox` en una sola diapositiva con TikZ | La figura es más ancha que su columna. Se achica la escala (`x=0.9cm`), se acercan los nodos o se ensancha la columna |
| `Device or resource busy` al compilar | El PDF está abierto en un visor que lo bloquea. Cerralo o usá uno que no bloquee, como SumatraPDF |
