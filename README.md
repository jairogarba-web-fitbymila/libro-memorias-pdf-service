# Libro de Memorias - PDF Service

Servicio dedicado para generar PDFs de libros de memorias usando Puppeteer.

## ¿Por qué un servicio separado?

- **Sin timeouts**: Vercel tiene límite de 60s, este servicio puede tardar lo que necesite
- **Sin límites de memoria**: Puppeteer requiere ~200-500MB por PDF
- **Escalable**: Railway.app escala automáticamente según demanda
- **Robusto**: Si falla, se puede reintentar sin afectar la app principal

## Stack

- Node.js 18+
- Express
- Puppeteer (Chrome headless)
- Supabase (PostgreSQL + Storage)

## API

### POST /generate-pdf

Genera un PDF completo de un libro.

**Request:**
```json
{
  "bookId": "uuid-del-libro"
}
```

**Response:**
```json
{
  "success": true,
  "pdfUrl": "https://supabase.co/storage/...",
  "bookId": "uuid",
  "title": "Título del libro",
  "format": "MEMORIA",
  "stats": {
    "memoriesCount": 28,
    "chaptersCount": 7,
    "sizeKB": 856,
    "sizeMB": "0.84",
    "totalTime": "12s"
  }
}
```

### GET /health

Health check del servicio.

## Deployment Railway.app

1. Conectar repo GitHub
2. Configurar variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Railway detecta automáticamente el Dockerfile
4. Deploy automático en cada push a main

## Costos

- **0-500 PDFs/mes**: GRATIS (Railway free tier: $5 crédito/mes)
- **500-3000 PDFs/mes**: $5-20/mes
- **3000+ PDFs/mes**: $20-50/mes

Cada PDF tarda ~10-30 segundos = ~0.003-0.008 horas de compute.

## Local Development

```bash
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

Test:
```bash
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"bookId":"uuid-here"}'
```
