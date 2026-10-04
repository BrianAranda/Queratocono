## Highlights
 * Page 8 (Antecedentes): "ViT"

 * Page 15 (Cronograma de Actividades): "software"


## Detailed comments
 * Page 1: "Krujoski, Matias Gabriel" -- Es cierto que todavía no soy Doctor pero al menos el título de Ingeniero lo tengo, no es tan común, no mucha gente lo tiene y a mucha honra me lo gané.

 * Page 2: "Pentacam o Sirius" -- Asegurarse de que estos nombres comerciales estén bien escritos, en algunos casos requieren símbolos como ® o ™ por tratarse de la denominación propietaria de un producto.

 * Page 2: "SaMD" -- Agregar la aclaración "por sus siglas del inglés Software as Medical..."

 * Page 2: "XAI" -- también aclarar el origen de la sigla; puede ser in-line acá o usando notas al pie enumeradas, como más les guste. Pero cada vez que se menciona por primera vez una sigla tiene que estar explicada, luego se puede simplemente usarla. 

 * Page 5 (Análisis del problema): "¿Qué es el queratocono?" -- Si bien el texto se enfoca precisamente en tratar de responder a esta pregunta, es un poco informal que la misma quede explicitada por escrito en el documento.

 * Page 5 (Análisis del problema): "cornea sana y con queratocono" -- es necesario explicitar cuál es cual, por ejemplo sub-enumerando las figuras como a y b, entonces acá en este título se dice a) sana, b) queratocono. Además, así después en el resto del trabajo se puede decir "como se observó en la figura 1.a la córnea con queratocono tiene ..." y si el lector lo desea, puede volver acá para refrescar la imagen mental de la consecuencia.

 * Page 5 (Análisis del problema): "Inteligencia Artificial" -- si previamente se enuncia bien por su sigla, luego ya se puede usar simplemente IA; que aunque es ampliamente conocida, por coherencia debe describirse la primera vez que se usa cómo cualquier otra sigla.

 * Page 6 (Análisis del problema):
   > A pesar de los avances en imagenología corneal, la detección de estadios subclínicos continúa siendo un desafío, con una sensibilidad diagnóstica reportada del 90 % mediante sistemas de IA (frente al 98, 6 % en casos clínicos ya manifiestos), lo que evidencia una menor capacidad discriminativa en etapas tempranas

   Yo entiendo lo que están queriendo decir pero para un lector menos versado en la materia resulta complicado entender porqué dicen que hay dificultades para el diagnóstico temprano; busquen la forma de mejorar un poquito esta explicación.

 * Page 6 (Análisis del problema): "ectasia corneal" -- conviene explicar muy brevemente qué es, aunque sea entre paréntesis o con nota la pie o algo, porque sino simplemente no queda claro la gravedad del retardo en el diagnóstico.

 * Page 6 (Análisis del problema):
   > actuaria

   actuaría

   falta tilde

 * Page 6 (Análisis del problema):
   > Por otro lado, el cumplimiento de las normativas de la ANMAT, específicamente las disposiciones 2318/02 y 9688/19 [9, 10], es necesario para clasificar el software como un producto médico seguro y eficaz.

   Entiendo lo que tratan de decir, pero no está bien explicado; se pude mejorar un poquito.

 * Page 7 (Antecedentes):
   > solo

   sólo

   va tildado cuando corresponde a solamente

 * Page 9 (Justificación): "accesibilidad," -- evitar el uso de negritas para destacar en el texto, no es propio de un documento de estilo académico.

 * Page 9 (Justificación): "hardware" -- debe ir en itálica

 * Page 9 (Justificación): "software" -- también en cursivas, todas las veces que aparezca

 * Page 9 (Justificación): "Oculus o Topcon" -- mismo detalle que con los otros nombres comerciales, ver si no llevan algún símbolo o algo

 * Page 10 (Justificación): "$150.000" -- agregar espacio duro entre el símbolo de pesos y la magnitud

 * Page 13 (Software como producto médico y marco regulatorio): "SaMD (Software as a Medical Device)" -- lo que les decía allá arriba, de dónde debe definirse la sigla

 * Page 14 (Software como producto médico y marco regulatorio): "Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT)" -- Esta descripción larga del nombre también es necesaria allá dónde aparece por primera vez la sigla.

 * Page 15 (Cronograma de Actividades): "12 meses." -- siendo la materia de un cuatrimestre ¿es aceptable este plazo triplicado?

 * Page 15 (Cronograma de Actividades): "150 muestras locales" -- ¿es razonable esta cantidad? digo en términos de cuántos pacientes se atienden por esta patología en promedio en la región y cuántos de ellos se hacen el estudio como para apuntar a conseguir sus informes.

 * Page 15 (Cronograma de Actividades): "diferentes fabricantes (Pentacam, Sirius, Galilei)" -- dejar atados los 3 fabricantes implica que si o si habrá que ofrecer la compatibilidad para esos tres formatos, hay que ser cuidadosos porque si no podemos conseguir los archivos crudos tal cual salen del aparato entonces será medio difícil cumplir con esto.

 * Page 16 (Cronograma de Actividades):
   > Finalmente, en la cuarta etapa de certificación regulatoria y lanzamiento, abarcaríamos dos meses finales, se gestionará la alineación legal del proyecto y se pondrá en marcha la infraestructura. Se preparará el informe técnico, junto a un abogado consultor, para la inscripción del sistema como producto médico Clase II ante la ANMAT. Se redactarán los contratos de confidencialidad, los términos de uso con limitación de responsabilidad clínica, y los consentimientos informados en cumplimiento con la Ley N° 25.326 de Protección de Datos Personales

   No me gusta que se haga esto al final; si bien el registro se completa al final, en cualquier proyecto es crucial tener bien en claro desde el principio "qué necesitamos para cumplir con la certificación de calidad"; porque sino al final por ejemplo se pueden encontrar con que durante el proceso de desarrollo debieron seguir una política de documentación y trazabilidad, registrando algún tipo de bitácora o algo que debe contener ciertos detalles muy específicos exigidos por la norma. Entonces si al final te das cuenta de que no tenes anotado lo que necesitas, ya no podes completar el registro o tendrías que empezar a reconstruir en forma retroactiva; por eso desde el inicio debe estar claro cuáles son esos requisitos regulatorios mínimos que el proceso de desarrollo en si debe cumplir para que vayan "anotando" y "guardando" todo eso que después se debe "presentar" en la auditoria de certificación.

 * Page 28 (Distribución Financiera): "Financiera" -- evitar el uso de title case, no es propio de la escritura en español

 * Page 28 (Distribución Financiera):
   > se apalanca el flujo de caja con un préstamo estratégico de $20.000.000 ARS del Fondo de Crédito Misiones, el cual cuenta con una tasa subsidiada (TNA del 28 %) y 6 meses de gracia para el pago de capital

   verificar bien en el sitio de FCM si las condiciones que enuncian son actuales correctas o corregir.


## Nits
 * Page 2 suggested deletion:
   > ~~La~~ sistema procesa de forma...

   El

 * Page 5 (Análisis del problema) suggested deletion:
   > Esto altera la manera en que la luz ~~entra~~ al ojo, generando visión...

   ingresa

 * Page 5 (Análisis del problema) suggested deletion:
   > ...evaluación y reducir la ~~subjetividad ~~inherente al proceso [3]. 

   variabilidad, es un poco rudo decir que hay subjetividad

 * Page 7 (Antecedentes) suggested deletion:
   > ...multi-agente AEYE [20] están ~~transicionando de la investigación académica a herramientas~~. 

   evolucionando desde la investigación académica hacia las herramientas comerciales de aplicación.

 * Page 11 (Inteligencia Artificial en medicina: estado del arte) suggested deletion:
   > estado del arte La aplicación de la Inteligencia Artificial ~~(IA)~~ en el ámbito médico...

   va allá arriba la primera vez que se menciona

 * Page 16 (Cronograma de Actividades) suggested deletion:
   > ...VPS bajo protocolos de ~~alta~~ seguridad, con asesoramiento del...

   subjetivo, inconmensurable; por lo tanto imposible. La seguridad se puede también medir en términos de qué niveles de protección ofrece bajo determinados escenarios de factibilidad de amenaza.

