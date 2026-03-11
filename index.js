import express from 'express'
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xuyacfbwqzqnxojgzqmw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('[INIT] ❌ FATAL: SUPABASE_SERVICE_ROLE_KEY no está configurada')
  process.exit(1)
}

console.log('[INIT] 🚀 Iniciando servicio PDF...')
console.log('[INIT] 📡 Supabase URL:', SUPABASE_URL)
console.log('[INIT] 🔑 Service key:', SUPABASE_KEY ? 'Configurado ✅' : 'FALTA ❌')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'libro-memorias-pdf', timestamp: new Date().toISOString() })
})

// Generate PDF endpoint
app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] 📖 Nueva solicitud de PDF`)
  
  try {
    const { bookId } = req.body
    
    if (!bookId) {
      return res.status(400).json({ error: 'bookId requerido' })
    }
    
    console.log(`[PDF] 📚 Generando libro: ${bookId}`)
    
    // 1. Obtener datos del libro
    console.log('[PDF] ⏳ Obteniendo datos...')
    const { data: book, error: bookError } = await supabase
      .from('memory_books')
      .select(`
        *,
        book_generation_config (*)
      `)
      .eq('id', bookId)
      .single()
    
    if (bookError || !book) {
      console.error('[PDF] ❌ Error libro:', bookError)
      return res.status(404).json({ error: 'Libro no encontrado' })
    }
    
    const config = book.book_generation_config?.[0] || {}
    console.log(`[PDF] ✅ Libro: ${book.title}`)
    
    // 2. Obtener capítulos
    const { data: chapters, error: chaptersError } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number')
    
    if (chaptersError || !chapters || chapters.length === 0) {
      console.error('[PDF] ❌ Error capítulos:', chaptersError)
      return res.status(400).json({ error: 'No hay capítulos generados' })
    }
    
    console.log(`[PDF] ✅ ${chapters.length} capítulos`)
    
    // 3. Obtener memorias
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'ready')
      .order('created_at')
    
    if (memoriesError || !memories || memories.length === 0) {
      console.error('[PDF] ❌ Error memorias:', memoriesError)
      return res.status(400).json({ error: 'No hay memorias aprobadas' })
    }
    
    console.log(`[PDF] ✅ ${memories.length} memorias`)
    
    // 4. Generar HTML
    console.log('[PDF] 🎨 Generando HTML...')
    const html = generateBookHTML(book, config, chapters, memories)
    
    // 5. Configurar formato según plan
    const formatMap = {
      'origen': { width: '6in', height: '9in', name: 'MEMORIA' },
      'legado': { width: '7in', height: '10in', name: 'LEGADO' },
      'obra': { width: '8.5in', height: '11in', name: 'ETERNO' }
    }
    
    const format = formatMap[book.plan_type?.toLowerCase()] || formatMap.origen
    console.log(`[PDF] 📐 Formato: ${format.name} (${format.width} × ${format.height})`)
    
    // 6. Generar PDF con Puppeteer
    console.log('[PDF] 🖨️ Iniciando Puppeteer...')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })
    
    const page = await browser.newPage()
    
    // Cargar HTML
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // Generar PDF
    console.log('[PDF] 📄 Generando PDF...')
    const pdfBuffer = await page.pdf({
      format: 'A4', // Puppeteer no soporta formatos custom, usamos A4 y ajustamos con CSS
      printBackground: true,
      margin: {
        top: '0.75in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.5in'
      },
      preferCSSPageSize: true
    })
    
    await browser.close()
    
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    const sizeMB = (sizeKB / 1024).toFixed(2)
    console.log(`[PDF] ✅ PDF generado: ${sizeKB.toLocaleString()} KB (${sizeMB} MB)`)
    
    // 7. Subir a Supabase Storage
    console.log('[PDF] ☁️ Subiendo a Supabase...')
    const fileName = `libro-${bookId}-${Date.now()}.pdf`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-books')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (uploadError) {
      console.error('[PDF] ❌ Error subiendo:', uploadError)
      throw new Error('Error al subir PDF: ' + uploadError.message)
    }
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('generated-books')
      .getPublicUrl(fileName)
    
    console.log('[PDF] ✅ PDF subido')
    
    // 8. Actualizar libro en BD
    console.log('[PDF] 💾 Actualizando registro...')
    const { error: updateError } = await supabase
      .from('memory_books')
      .update({
        generated_pdf_url: publicUrl,
        last_generated_at: new Date().toISOString(),
        generations_count: (book.generations_count || 0) + 1,
        status: 'ready'
      })
      .eq('id', bookId)
    
    if (updateError) {
      console.error('[PDF] ❌ Error actualizando:', updateError)
      throw new Error('Error al actualizar libro: ' + updateError.message)
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    console.log(`[PDF] 🎉 ¡ÉXITO! (${totalTime}s)`)
    
    res.json({
      success: true,
      pdfUrl: publicUrl,
      bookId,
      title: book.title,
      format: format.name,
      stats: {
        memoriesCount: memories.length,
        chaptersCount: chapters.filter(c => c.chapter_type === 'chapter').length,
        sizeKB,
        sizeMB,
        totalTime: `${totalTime}s`
      }
    })
    
  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.error(`[PDF] ❌ ERROR (${elapsed}s):`, error.message)
    console.error(error.stack)
    
    res.status(500).json({
      error: error.message || 'Error desconocido al generar PDF',
      elapsed: `${elapsed}s`
    })
  }
})

// Función para generar HTML del libro
function generateBookHTML(book, config, chapters, memories) {
  const getMemoryText = (memory) => {
    return memory.enriched_text || memory.original_text || memory.transcription || ''
  }
  
  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <style>
    @page {
      size: A4;
      margin: 0.75in 0.5in;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1A1208;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 28pt;
      text-align: center;
      margin: 2in 0 0.5in 0;
      font-weight: bold;
      page-break-before: always;
    }
    
    h2 {
      font-size: 16pt;
      text-align: center;
      margin: 1.5in 0 0.5in 0;
      font-weight: bold;
      page-break-before: always;
    }
    
    h3 {
      font-size: 10pt;
      font-style: italic;
      margin: 1em 0 0.5em 0;
      color: #666;
    }
    
    p {
      margin: 0 0 1em 0;
      text-align: justify;
    }
    
    .subtitle {
      font-size: 18pt;
      text-align: center;
      font-style: italic;
      margin: 0.5in 0;
    }
    
    .dedication {
      text-align: center;
      font-style: italic;
      margin: 2in 0;
    }
    
    .copyright {
      font-size: 10pt;
      margin: 2in 0;
    }
    
    .memory-header {
      font-style: italic;
      font-size: 10pt;
      color: #666;
      margin: 1.5em 0 0.5em 0;
    }
    
    .transition {
      font-style: italic;
      margin: 1em 0;
      color: #555;
    }
    
    .chapter-closing {
      font-style: italic;
      margin: 2em 0;
      text-align: center;
    }
    
    .colophon {
      text-align: center;
      margin: 3in 0;
      font-style: italic;
    }
    
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

<!-- PORTADILLA -->
<div class="page-break">
  <h1>${book.title}</h1>
  <p class="subtitle">Memorias de ${book.honoree_name}</p>
  <p class="subtitle" style="font-size: 12pt;">${book.honoree_relationship || 'Su familia'}</p>
</div>

<!-- COPYRIGHT -->
<div class="page-break">
  <div class="copyright">
    <p>Copyright © ${new Date().getFullYear()} ${book.honoree_name}</p>
    <p>Todos los derechos reservados.</p>
    <p>&nbsp;</p>
    <p>Este libro de memorias ha sido creado con amor por la familia.</p>
    <p>Ninguna parte puede ser reproducida sin permiso expreso.</p>
    <p>&nbsp;</p>
    <p>Creado con Libro de Memorias</p>
    <p>librodememorias.com</p>
  </div>
</div>

<!-- DEDICATORIA -->
<div class="page-break">
  <div class="dedication">
    <p>Para ${book.honoree_name},</p>
    <p>con todo nuestro amor</p>
  </div>
</div>
`
  
  // PRÓLOGO
  if (config.include_prologue) {
    const prologueText = config.prologue_type === 'manual' 
      ? config.prologue_manual_text 
      : config.prologue_generated_text
    
    if (prologueText) {
      html += `
<div class="page-break">
  <h2>PRÓLOGO</h2>
  <p>${prologueText}</p>
</div>
`
    }
  }
  
  // CAPÍTULOS
  for (const chapter of chapters) {
    if (chapter.chapter_type === 'intro') {
      if (chapter.generated_opening) {
        html += `
<div class="page-break">
  <p>${chapter.generated_opening}</p>
</div>
`
      }
    } else if (chapter.chapter_type === 'chapter') {
      // Separador
      html += `
<div class="page-break">
  <h2>${chapter.title}</h2>
`
      if (chapter.subtitle) {
        html += `  <p class="subtitle" style="font-size: 12pt;">${chapter.subtitle}</p>\n`
      }
      html += `</div>\n`
      
      // Apertura
      if (chapter.generated_opening) {
        html += `<p>${chapter.generated_opening}</p>\n`
      }
      
      // Memorias
      const chapterMemories = memories.filter(m => chapter.memory_ids.includes(m.id))
      
      for (let i = 0; i < chapterMemories.length; i++) {
        const memory = chapterMemories[i]
        
        html += `
<div class="memory-header">
  ${memory.contributor_name} (${memory.contributor_relationship || 'Familiar'})
</div>
<p>${getMemoryText(memory)}</p>
`
        
        // Transición
        if (i < chapterMemories.length - 1 && chapter.generated_transitions) {
          const nextMemory = chapterMemories[i + 1]
          const transitionKey = `${memory.id}_to_${nextMemory.id}`
          const transition = chapter.generated_transitions[transitionKey]
          
          if (transition) {
            html += `<p class="transition">${transition}</p>\n`
          }
        }
      }
      
      // Cierre
      if (chapter.generated_closing) {
        html += `<p class="chapter-closing">${chapter.generated_closing}</p>\n`
      }
    } else if (chapter.chapter_type === 'epilogue') {
      html += `
<div class="page-break">
  <h2>EPÍLOGO</h2>
  <p>${chapter.generated_opening || ''}</p>
</div>
`
    }
  }
  
  // COLOFÓN
  const date = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  html += `
<div class="page-break">
  <div class="colophon">
    <p>Este libro fue creado con amor por la familia</p>
    <p>${date}</p>
    <p>&nbsp;</p>
    <p style="font-size: 10pt;">Libro de Memorias · librodememorias.com</p>
  </div>
</div>

</body>
</html>
`
  
  return html
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Service running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`📄 Generate PDF: POST http://localhost:${PORT}/generate-pdf`)
})
