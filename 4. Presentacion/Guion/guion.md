<!-- LTeX: enabled=false -->
# Guion de la presentación del TP3

La consigna pide mostrar los resultados, cómo funciona la propuesta, las evidencias y la correspondencia entre objetivos y resultados, marcando cada uno como alcanzado, en proceso o pendiente. El límite es de 20 minutos.

El guion está pensado para unos 16 minutos de exposición. Así quedan unos 4 minutos de margen para los cambios de diapositiva, mostrar el QR y alguna pregunta durante la exposición. Uno de los docentes no es técnico, por eso cada término técnico se explica en una frase la primera vez que aparece.

## Tiempos

| N.º | Diapositiva | Tiempo | Quién (sugerido) |
|---|---|---|---|
| 1 | Portada | 0:20 | Brian |
| 2 | El problema | 1:20 | Brian |
| 3 | Qué mide el equipo | 1:15 | Fabricio |
| 4 | Qué es KERALYTIX | 1:15 | Fabricio |
| 5 | Objetivos | 0:45 | Brian |
| 6 | Fases y estado actual | 0:45 | Brian |
| 7 | Fase 1: selección del conjunto de datos | 0:50 | Fabricio |
| 8 | Fase 1: revisión de los datos | 1:00 | Fabricio |
| 9 | Fase 1: qué dicen los datos clínicos | 0:50 | Fabricio |
| 10 | Datos locales para la validación | 1:00 | Brian |
| 11 | Fase 2: cómo funciona el modelo | 1:20 | Brian |
| 12 | Fase 2: primeros resultados | 1:20 | Fabricio |
| 13 | Fase 2: el modelo muestra dónde miró | 1:00 | Brian |
| 14 | Fase 3: la aplicación web | 0:50 | Fabricio |
| 15 | Lo que nos propusimos y lo que logramos | 1:00 | Brian |
| 16 | Próximos pasos | 0:40 | Brian |
| 17 | Preguntas | 0:10 | Fabricio |
| | **Total** | **15:40** | |

El reparto es una sugerencia. La primera mitad presenta el problema, el proyecto y los datos. La segunda presenta el modelo y la web, que es lo que desarrolla Fabricio. El cambio de orador queda en la diapositiva 11, justo donde empieza la fase 2.

## 1. Portada (0:20)

Buenas tardes. Somos Brian Aranda y Fabricio Wlodeck, del grupo 7, y nuestro tutor es el ingeniero Krujoski. Vamos a presentar el avance de KERALYTIX, un sistema que ayuda a detectar el queratocono en sus primeras etapas usando inteligencia artificial.

## 2. El problema: detectar el queratocono a tiempo (1:20)

El queratocono es una enfermedad de la córnea, la parte transparente y curva del frente del ojo. La córnea se adelgaza y se deforma hasta tomar forma de cono, como se ve en la imagen de abajo comparada con la de arriba.

Aparece en personas jóvenes y avanza rápido. Al principio se confunde con miopía o astigmatismo, así que muchas veces se detecta tarde. Incluso con las herramientas de inteligencia artificial que existen hoy, uno de cada diez casos iniciales pasa desapercibido. Si se detecta tarde, el paciente puede terminar necesitando un trasplante de córnea.

Por eso el foco del proyecto no está en la enfermedad en sí. Está en detectarla a tiempo.

## 3. Qué mide el equipo (1:15)

Para diagnosticar el queratocono, el oftalmólogo usa un equipo que mide la forma de la córnea. Este esquema muestra un corte de una córnea con queratocono. La línea punteada es la forma ideal y la línea llena es la córnea real.

El equipo mide tres cosas principales. La primera es la curvatura máxima, llamada K max, que marca el punto donde la córnea está más curva. La segunda es el espesor mínimo, el espesor en el punto más delgado. La tercera es la elevación, es decir, cuánto sobresale cada cara de la córnea respecto de la forma ideal.

A la derecha se ve la córnea de frente, con la ubicación del punto más delgado. Todos estos valores son los datos con los que trabaja nuestro sistema.

## 4. Qué es KERALYTIX (1:15)

KERALYTIX es una herramienta web que le da al oftalmólogo una segunda opinión sobre el estudio. El diagrama se lee de izquierda a derecha.

Recibe dos cosas. Los cuatro mapas de la córnea que exporta el equipo, que son imágenes, y los datos del paciente, que son números en una tabla. Como combina estos dos tipos de datos, decimos que el modelo es multimodal.

El modelo de inteligencia artificial analiza las imágenes y los datos juntos. Entrega un informe que dice si el ojo es normal o tiene queratocono, con qué confianza lo dice y un mapa de calor. El mapa de calor marca qué zonas de la córnea llevaron a ese resultado, así el médico puede ver en qué se basó el sistema. La decisión final es siempre del médico.

## 5. Objetivos (0:45)

El objetivo general es desarrollar este sistema de soporte a la decisión clínica, accesible desde una aplicación web.

Para eso nos planteamos cuatro objetivos específicos. Analizar un conjunto de datos público, construir el modelo de inteligencia artificial, integrar la explicación visual con el mapa de calor y desarrollar la aplicación web. Durante la presentación vamos a mostrar cuánto avanzamos en cada uno.

## 6. Fases del proyecto y estado actual (0:45)

El trabajo se organiza en tres fases. La primera, de comprensión y selección de datos, se hizo en agosto y cubre el objetivo 1. La segunda es el modelado, de septiembre a noviembre, y cubre los objetivos 2 y 3. La tercera es la aplicación web, que se superpone con el final del modelado y va de noviembre a diciembre.

La línea roja marca dónde estamos hoy. La primera fase está terminada y estamos cerrando la segunda.

## 7. Fase 1: selección del conjunto de datos (0:50)

Arrancamos con la primera fase. Elegimos CornOrb, un conjunto de datos público con 1.454 registros de ojos de 744 pacientes y 5.628 imágenes de mapas corneales.

Lo elegimos porque cada ojo trae sus cuatro mapas y sus datos clínicos juntos, que es justo lo que necesita un modelo multimodal. Además, el diagnóstico de cada ojo lo asignaron oftalmólogos, así que sabemos cuál es la respuesta correcta para entrenar y evaluar el modelo.

Con esto damos por alcanzado el objetivo 1.

## 8. Fase 1: revisión de los datos (1:00)

Antes de entrenar revisamos los datos. Este análisis se llama exploratorio. El gráfico muestra que el 61 % de los registros son ojos normales y el 39 % ojos con queratocono. Hay más casos normales, pero la diferencia no es extrema.

Lo positivo es que no faltan datos ni imágenes y que los ojos de un mismo paciente nunca quedan repartidos entre entrenamiento y prueba. Esto es importante porque, si no, el modelo se evaluaría con un paciente que ya conoce y el resultado parecería mejor de lo que es.

También encontramos cosas para corregir. Hay 46 ojos medidos más de una vez, un código de paciente mal escrito y algunos valores imposibles, como una curvatura de 4 cuando lo normal ronda 44.

## 9. Fase 1: qué dicen los datos clínicos (0:50)

Después medimos cuánto se relaciona cada dato clínico con el diagnóstico. Cuanto más larga es la barra, más se relaciona.

Los ojos con queratocono tienen una córnea más curva, de 53 dioptrías frente a 44, más delgada, de 428 micrones frente a 521, y con más astigmatismo. Esto coincide con lo que describe la medicina sobre la enfermedad.

Estos datos ya separan bastante los dos grupos. Por eso el modelo los combina con las imágenes en vez de usar solo una de las dos cosas.

## 10. Datos locales para la validación (1:00)

CornOrb viene de pacientes de Argelia. Para comprobar que KERALYTIX funciona con pacientes de nuestra región, necesitamos estudios locales.

Contactamos nueve centros y profesionales de Misiones, Córdoba, Buenos Aires y Perú. Además, por medio del programador Gonzalo Pozzo, llegamos a Roberto Albertazzi, expresidente de la Sociedad Internacional de Queratocono. Tuvimos una charla con él sobre la posibilidad de conseguir estudios para validar el modelo.

Hoy estamos en los trámites legales para hacer la solicitud. El paso siguiente es recibir estudios locales anonimizados, es decir, sin datos que permitan identificar al paciente. Por eso este punto figura en proceso.

## 11. Fase 2: cómo funciona el modelo (1:20)

*(Cambio de orador.)*

Pasamos a la segunda fase, el modelo. El modelo tiene dos ramas. Cada rama se especializa en un tipo de dato.

La rama de imágenes recibe los mapas y aprende a reconocer las formas que aparecen en ellos. Para esto se usa una red neuronal convolucional, un tipo de modelo pensado para imágenes. La rama de datos recibe los valores numéricos del paciente. Después, la fusión junta lo que encontró cada rama y aprovecha la relación entre ambas. El resultado es la clasificación, normal o queratocono, con su nivel de confianza.

Arriba está Grad-CAM, la técnica que genera el mapa de calor. Mira la rama de imágenes y marca qué zonas pesaron más en el resultado.

## 12. Fase 2: primeros resultados (1:20)

Para la rama de imágenes probamos tres redes base. Son modelos que ya fueron entrenados con millones de imágenes y que se adaptan a los mapas corneales, así no hay que entrenar todo desde cero. En esta primera prueba la que mejor funcionó fue MobileNetV2, la más liviana de las tres. Todavía estamos probando otras redes y estrategias.

La prueba se hizo con 279 ojos que el modelo nunca vio durante el entrenamiento. Detectó 95 de los 103 ojos con queratocono, un 92 %, y no dio ninguna falsa alarma en los 176 ojos sanos.

Un modelo que usa solo los datos clínicos da resultados parecidos. Por eso el paso final de esta fase es la fusión, combinar las dos cosas en un solo modelo.

## 13. Fase 2: el modelo muestra dónde miró (1:00)

Esta es la evidencia del objetivo 3. A la izquierda está el mapa de la córnea y a la derecha el mapa de calor que genera Grad-CAM, para dos ojos de prueba.

En el ojo con queratocono, el calor cae sobre la zona deformada, y el modelo lo clasificó como queratocono con total confianza. En el ojo sano no marca la zona central de la córnea, y lo clasificó como sano.

Esto le permite al oftalmólogo comprobar en qué se basó cada resultado, en vez de recibir solo una respuesta sin explicación.

## 14. Fase 3: la aplicación web (0:50)

La tercera fase es la aplicación web. El oftalmólogo entra desde el navegador a la página, carga los estudios y ve el informe. La página se comunica con un servidor, que recibe los estudios y ejecuta el modelo. El acceso funciona con un modelo de suscripción.

La página se hace con React y el servidor con FastAPI, dos herramientas muy usadas para este tipo de sistemas. Esta fase se trabaja en noviembre y diciembre, superpuesta con el cierre del modelo.

*(Si el QR ya está, invitar a escanearlo y decir qué se ve en la página.)*

## 15. Lo que nos propusimos y lo que logramos (1:00)

Para cerrar, esta tabla resume cada objetivo con lo que logramos y su estado.

El objetivo 1, analizar el conjunto de datos, está alcanzado. El objetivo 2, el modelo, está en proceso. Tenemos una primera prueba con los mapas que detecta el 92 % de los queratoconos sin falsas alarmas, seguimos probando redes y estrategias y falta la fusión con los datos clínicos. El objetivo 3, la explicación visual, también está en proceso, porque Grad-CAM ya funciona pero falta mostrarlo en el informe. El objetivo 4, la aplicación web, está por empezar, con las herramientas ya definidas. Y la validación con datos locales sigue en proceso con los trámites.

## 16. Próximos pasos (0:40)

En noviembre vamos a seguir probando redes y estrategias, combinar los mapas con los datos clínicos, ajustar el modelo para detectar al menos el 95 % de los queratoconos y empezar la aplicación web.

En diciembre vamos a terminar la web, conectarla con el modelo, generar el informe con el resultado y el mapa de calor y tener el prototipo funcionando de punta a punta. En paralelo seguimos con los trámites para los datos locales.

## 17. Preguntas (0:10)

Esto es todo. Muchas gracias. ¿Tienen alguna pregunta?

## Preguntas probables

**¿Para qué usar imágenes si los datos clínicos solos dan un resultado parecido?** Por tres motivos. Las imágenes permiten mostrar el mapa de calor, que es la explicación visual del resultado. También automatizan el análisis, porque el modelo lee el mapa directamente. Y el objetivo es la fusión de las dos cosas, que todavía no está hecha. Esperamos que la combinación supere a cada una por separado.

**¿Por qué el 92 % si la meta es el 95 %?** Es el resultado de la primera prueba. El margen de esa medición va de 85 % a 96 %, así que no se puede afirmar todavía si la meta se cumple o no. Con las pruebas de otras redes y la fusión buscamos llegar al 95 %.

**¿Por qué 1.454 registros y no 1.454 ojos distintos?** Porque 46 ojos se midieron más de una vez. Los ojos distintos son 1.407, y las mediciones repetidas se tratan como un solo ojo.

**¿Funciona con pacientes de acá?** Todavía no lo sabemos, porque CornOrb viene de Argelia. Por eso buscamos estudios locales para validarlo.

**¿Funciona con cualquier equipo?** El prototipo usa mapas del equipo Orbscan, que es el del conjunto de datos. Llevarlo a otros equipos, como el Pentacam, queda como línea futura.

**¿El sistema reemplaza al médico?** No. Es una segunda opinión. La decisión siempre la toma el oftalmólogo.

Para el detalle de los datos clínicos por grupo está la diapositiva de respaldo, después de la de preguntas.
