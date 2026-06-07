import anthropic
from config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """Eres un asistente médico especializado en educación médica de alto nivel universitario.
Respondes siempre en español, independiente del idioma del texto recibido, a menos que se indique explícitamente.
Tus respuestas son precisas, basadas en evidencia médica actual y guías clínicas vigentes (UpToDate, Harrison's, ESC, AHA, etc.).
Cuando generas JSON, devuelves ÚNICAMENTE el JSON sin texto adicional, sin bloques markdown, sin comillas extra."""

async def _call(prompt: str, max_tokens: int = 2048) -> str:
    response = await client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

async def generate_summary(text: str, summary_type: str) -> str:
    prompts = {
        "executive": f"""Genera un resumen ejecutivo en español del siguiente texto médico.
Estructura el contenido en secciones numeradas con títulos en mayúsculas (sin usar markdown con # ni **).
Usa saltos de línea para separar secciones. Sé exhaustivo: cubre todos los temas del texto sin omitir información relevante. TEXTO:
{text}""",
        "bullets": f"""Extrae TODOS los puntos clave del siguiente texto médico en bullet points.
Usa el formato: • punto clave (sin markdown con * ni #).
Agrupa por temas con un encabezado en mayúsculas antes de cada grupo.
No limites el número de puntos: incluye todos los conceptos clínicamente relevantes. TEXTO:
{text}""",
        "mechanism": f"""Explica el mecanismo de acción o fisiopatología descrito en el siguiente texto.
Estructura en pasos numerados y secuenciales (sin markdown con # ni **).
Usa MAYÚSCULAS para los títulos de sección. Sé detallado e incluye todos los mecanismos mencionados. TEXTO:
{text}""",
        "flashcards": f"""Genera flashcards estilo Anki del siguiente texto médico. Crea tantas como sean necesarias para cubrir todos los conceptos importantes (mínimo 15).
Devuelve SOLO este JSON (sin texto adicional): [{{"front": "pregunta", "back": "respuesta completa"}}] TEXTO:
{text}"""
    }
    return await _call(prompts.get(summary_type, prompts["executive"]), max_tokens=8000)

async def generate_disease_card(disease_name: str) -> str:
    prompt = f"""Genera una ficha médica sobre: {disease_name}
Devuelve SOLO este JSON válido, sin texto adicional, sin markdown. Sé conciso (máx 3-4 oraciones por campo):
{{"name":"{disease_name}","etiology":"...","pathophysiology":"...","clinical_presentation":"...","diagnosis":"...","treatment":"...","prognosis":"..."}}"""
    return await _call(prompt, max_tokens=8000)

DIAGRAM_INSTRUCTIONS = {
    "flowchart": "flowchart TD con nodos rectangulares, rombos para decisiones, flechas etiquetadas",
    "sequence": "sequenceDiagram con actores y mensajes entre ellos (ideal para interacciones fisiopatológicas)",
    "mindmap": "mindmap con nodo central y ramas jerárquicas",
    "timeline": "timeline con hitos y fechas/etapas cronológicas",
    "table": "Un flowchart que simule tabla comparativa: columnas como ramas paralelas desde un nodo raíz",
    "cascade": "flowchart TD con cadena en cascada de eventos, cada uno desencadenando el siguiente",
    "er": "erDiagram para relaciones entre entidades (síndromes, enfermedades, factores)",
}

async def generate_diagram(topic: str, context_text: str = None, diagram_type: str = "flowchart") -> str:
    context_block = f"\nBasa el diagrama en el siguiente contenido:\n{context_text[:4000]}\n" if context_text else ""
    instructions = DIAGRAM_INSTRUCTIONS.get(diagram_type, DIAGRAM_INSTRUCTIONS["flowchart"])
    prompt = f"""Genera un diagrama Mermaid.js ({diagram_type}) que represente: {topic}
{context_block}Tipo requerido: {instructions}
Reglas:
- Máximo 20 nodos/elementos para mantener claridad
- Textos en español
- Agrega estilos fill/color a nodos clave cuando aplique
- Devuelve SOLO el código Mermaid, sin markdown, sin explicación, sin bloques de código"""
    return await _call(prompt, max_tokens=1500)

async def generate_quiz(topic: str, quiz_type: str, num_questions: int = 5, context_text: str = None) -> str:
    context_block = f"\nBasa las preguntas en el siguiente contenido:\n{context_text[:6000]}\n" if context_text else ""

    if quiz_type == "multiple_choice":
        prompt = f"""Genera {num_questions} preguntas de selección múltiple de alto nivel sobre: {topic}
{context_block}Las preguntas deben ser tipo EUNACOM/MIR, con casos clínicos integrados.
Devuelve SOLO este JSON:
{{
"title": "Cuestionario: {topic}",
"type": "multiple_choice",
"questions": [
  {{
    "id": 1,
    "question": "enunciado del caso/pregunta",
    "options": ["A. opción", "B. opción", "C. opción", "D. opción"],
    "correct": "A",
    "explanation": "Por qué A es correcta y por qué cada distractor es incorrecto, con base en evidencia"
  }}
]
}}"""

    elif quiz_type == "development":
        prompt = f"""Genera {num_questions} preguntas de desarrollo de alto nivel sobre: {topic}
{context_block}Las preguntas deben requerir respuestas elaboradas, análisis clínico y razonamiento médico.
Devuelve SOLO este JSON:
{{
"title": "Preguntas de Desarrollo: {topic}",
"type": "development",
"questions": [
  {{
    "id": 1,
    "question": "Pregunta que requiere desarrollo amplio",
    "key_points": ["punto clave 1 que debe incluir la respuesta", "punto clave 2", "punto clave 3"],
    "model_answer": "Respuesta modelo completa y detallada"
  }}
]
}}"""

    elif quiz_type == "true_false":
        prompt = f"""Genera {num_questions} afirmaciones de verdadero/falso sobre: {topic}
{context_block}Las afirmaciones deben ser clínicamente relevantes y con matices importantes.
Devuelve SOLO este JSON:
{{
"title": "Verdadero o Falso: {topic}",
"type": "true_false",
"questions": [
  {{
    "id": 1,
    "statement": "afirmación clínica",
    "correct": true,
    "explanation": "justificación detallada de por qué es verdadero o falso"
  }}
]
}}"""

    else:  # clinical_case
        prompt = f"""Genera un caso clínico complejo sobre: {topic}
{context_block}Devuelve SOLO este JSON:
{{
"title": "Caso Clínico: {topic}",
"type": "clinical_case",
"case": "descripción detallada: paciente, anamnesis, examen físico, signos vitales, exámenes disponibles",
"expected_diagnosis": "diagnóstico principal y diferenciales",
"expected_treatment": "plan terapéutico completo con justificación",
"key_points": ["punto crítico 1", "punto crítico 2", "punto crítico 3"]
}}"""

    return await _call(prompt, max_tokens=6000)

async def evaluate_clinical_response(case: str, user_response: str, expected: dict) -> str:
    prompt = f"""Evalúa la respuesta de un estudiante de medicina (nivel internado) al siguiente caso clínico.
Sé riguroso pero formativo. Evalúa diagnóstico y manejo por separado.
CASO CLÍNICO:
{case}
RESPUESTA DEL ESTUDIANTE:
{user_response}
RESPUESTA ESPERADA (referencia):
Diagnóstico: {expected.get('expected_diagnosis')}
Tratamiento: {expected.get('expected_treatment')}
Puntos clave: {expected.get('key_points')}
Devuelve SOLO este JSON:
{{
"score": 7.5,
"diagnosis_score": 4.0,
"treatment_score": 3.5,
"feedback": "retroalimentación detallada y formativa",
"omissions": ["omisión crítica 1", "omisión crítica 2"],
"strengths": ["fortaleza identificada 1", "fortaleza 2"]
}}"""
    return await _call(prompt, max_tokens=1024)

async def evaluate_development_response(question: str, user_response: str, key_points: list, model_answer: str) -> str:
    prompt = f"""Evalúa la respuesta de desarrollo de un estudiante de medicina.
PREGUNTA:
{question}
RESPUESTA DEL ESTUDIANTE:
{user_response}
PUNTOS CLAVE ESPERADOS: {key_points}
RESPUESTA MODELO: {model_answer}
Devuelve SOLO este JSON:
{{
"score": 7.5,
"feedback": "retroalimentación detallada señalando aciertos y omisiones",
"covered_points": ["puntos que sí mencionó el estudiante"],
"missing_points": ["puntos importantes que no mencionó"],
"strengths": ["fortalezas de la respuesta"]
}}"""
    return await _call(prompt, max_tokens=1024)
