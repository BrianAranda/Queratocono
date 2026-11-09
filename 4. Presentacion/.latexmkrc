# Archivo principal (así alcanza con correr "latexmk" sin argumentos)
@default_files = ("main.tex");

# Nombre del PDF de salida
$jobname = "Presentacion";

# Compilar a PDF con pdflatex
$pdf_mode  = 1;
$pdflatex  = 'pdflatex -synctex=1 -interaction=nonstopmode -file-line-error %O %S';

# PDF junto al .tex y auxiliares en build/
$out_dir = ".";
$aux_dir = "build";
