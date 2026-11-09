# Archivo principal (así alcanza con correr "latexmk" sin argumentos)
@default_files = ("main.tex");

# Sin $jobname: el PDF se llama main.pdf, igual que el .tex, para que el visor
# de LaTeX Workshop lo encuentre (busca un PDF con el nombre del archivo raíz)

# Compilar a PDF con pdflatex
$pdf_mode  = 1;
$pdflatex  = 'pdflatex -synctex=1 -interaction=nonstopmode -file-line-error %O %S';

# PDF junto al .tex y auxiliares en build/
$out_dir = ".";
$aux_dir = "build";
