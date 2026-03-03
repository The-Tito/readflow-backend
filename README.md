# ReadFlow Backend - 🚀

Este repositorio contiene el núcleo lógico de **ReadFlow**, una plataforma EdTech orientada al aprendizaje activo. El sistema utiliza IA Generativa (Gemini) para transformar material académico en herramientas de estudio basadas en _Active Recall_ y _Spaced Repetition_.

## 🛠 Stack Tecnológico

- **Entorno:** Node.js + TypeScript
- **Framework:** Express.js (Arquitectura SOA en capas)
- **Base de Datos:** PostgreSQL + Prisma ORM
- **IA:** Gemini API (Modelo 2.5 Flash-Lite)
- **Infraestructura:** Docker Ready

## 📊 Métricas de Investigación

El backend está diseñado para calcular el **Índice de Retención Individual (IRI)** mediante la fórmula:
$$IRI = \frac{Score_{48h}}{Score_{Inmediato}}$$

## 📂 Estructura del Proyecto

- `src/routes`: Definición de endpoints.
- `src/controllers`: Manejo de peticiones y respuestas.
- `src/services`: Lógica de negocio e integración con Gemini.
- `src/config`: Configuraciones generales.
- `src/ultils`: Utilidades.

## 🚀 Instalación y Uso

1. Clonar el repositorio: `git clone <url-repo>`
2. Instalar dependencias: `npm install`
3. Configurar el `.env` (Ver sección variables de entorno).
4. Ejecutar migraciones: `npx prisma migrate dev`
5. Iniciar en desarrollo: `npm run dev`

## 🔑 Variables de Entorno (.env)

- `DATABASE_URL`: Conexión a PostgreSQL.
- `GEMINI_API_KEY`: API Key de Groq.
- `JWT_SECRET`: Secreto para tokens de sesión.
