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
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Crimson+Pro:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 1in 0.85in;
    }
    
    body {
      font-family: 'Crimson Pro', 'Georgia', serif;
      font-size: 11.5pt;
      line-height: 1.75;
      color: #2C2417;
      margin: 0;
      padding: 0;
      background: #FFFDF8;
    }
    
    /* === PORTADA === */
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%);
      padding: 2in 1in;
    }
    
    .cover-ornament {
      color: #C9A961;
      font-size: 24pt;
      letter-spacing: 0.5em;
      margin-bottom: 1in;
    }
    
    .cover-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 36pt;
      font-weight: 500;
      color: #1A1208;
      margin: 0 0 0.3in 0;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 16pt;
      font-style: italic;
      color: #6B5D4D;
      margin: 0.2in 0 0.5in 0;
      font-weight: 400;
    }
    
    .cover-line {
      width: 2in;
      height: 1px;
      background: linear-gradient(90deg, transparent, #C9A961, transparent);
      margin: 0.3in 0;
    }
    
    .cover-relationship {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 12pt;
      color: #8B7355;
      font-style: italic;
      margin-top: 0.5in;
    }
    
    /* === PÁGINAS PRELIMINARES === */
    .prelim-page {
      page-break-after: always;
      padding: 2in 0;
    }
    
    .dedication {
      text-align: center;
      font-style: italic;
      font-size: 14pt;
      color: #4A4035;
      margin: 3in 1in;
      line-height: 2;
    }
    
    .dedication::before {
      content: "❦";
      display: block;
      font-size: 18pt;
      color: #C9A961;
      margin-bottom: 0.5in;
    }
    
    .copyright {
      font-size: 9pt;
      color: #8B7355;
      margin: 2.5in 0 0 0;
      line-height: 1.8;
    }
    
    .copyright p {
      margin: 0.3em 0;
      text-align: center;
    }
    
    /* === CAPÍTULOS === */
    .chapter-opener {
      page-break-before: always;
      padding-top: 2.5in;
      text-align: center;
      margin-bottom: 1in;
    }
    
    .chapter-number {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: #C9A961;
      margin-bottom: 0.3in;
    }
    
    .chapter-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 24pt;
      font-weight: 500;
      color: #1A1208;
      margin: 0 0 0.2in 0;
      line-height: 1.3;
    }
    
    .chapter-subtitle {
      font-family: 'Crimson Pro', Georgia, serif;
      font-size: 12pt;
      font-style: italic;
      color: #6B5D4D;
      margin: 0;
    }
    
    .chapter-ornament {
      color: #C9A961;
      font-size: 14pt;
      margin-top: 0.4in;
      letter-spacing: 0.3em;
    }
    
    /* === CONTENIDO === */
    .chapter-opening {
      font-style: italic;
      font-size: 11pt;
      color: #4A4035;
      margin: 1.5in 0.5in 1in 0.5in;
      text-align: center;
      line-height: 1.9;
    }
    
    .memory-block {
      margin: 1.5em 0;
      padding: 0;
    }
    
    .memory-attribution {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 10pt;
      font-style: italic;
      color: #8B7355;
      margin-bottom: 0.4em;
      padding-left: 0;
    }
    
    .memory-attribution::before {
      content: "—";
      margin-right: 0.3em;
    }
    
    .memory-text {
      margin: 0 0 0.8em 0;
      text-align: justify;
      text-indent: 1.5em;
      hyphens: auto;
    }
    
    .memory-text:first-of-type {
      text-indent: 0;
    }
    
    .memory-text::first-letter {
      font-size: 1.1em;
    }
    
    .transition-text {
      font-style: italic;
      margin: 1.5em 1in;
      color: #6B5D4D;
      text-align: center;
      font-size: 10.5pt;
    }
    
    .chapter-closing {
      font-style: italic;
      margin: 2em 0.5in;
      text-align: center;
      color: #4A4035;
      font-size: 11pt;
    }
    
    .chapter-closing::after {
      content: "◆";
      display: block;
      margin-top: 1em;
      color: #C9A961;
      font-size: 10pt;
    }
    
    /* === SECCIONES ESPECIALES === */
    .prologue-page {
      page-break-before: always;
    }
    
    .section-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 18pt;
      text-align: center;
      color: #1A1208;
      margin: 2in 0 1in 0;
      text-transform: uppercase;
      letter-spacing: 0.2em;
    }
    
    .section-title::after {
      content: "";
      display: block;
      width: 1.5in;
      height: 1px;
      background: #C9A961;
      margin: 0.4in auto 0;
    }
    
    .prologue-text, .epilogue-text {
      font-style: italic;
      line-height: 1.9;
      color: #3D352A;
    }
    
    /* === COLOFÓN === */
    .colophon {
      page-break-before: always;
      text-align: center;
      padding-top: 3in;
      font-size: 10pt;
      color: #8B7355;
      line-height: 2;
    }
    
    .colophon-ornament {
      font-size: 18pt;
      color: #C9A961;
      margin-bottom: 1in;
    }
    
    .colophon p {
      margin: 0.3em 0;
    }
    
    .colophon-brand {
      margin-top: 1in;
      font-style: italic;
      font-size: 9pt;
    }
    
    /* === UTILIDADES === */
    .page-break {
      page-break-after: always;
    }
    
    .small-caps {
      font-variant: small-caps;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>

<!-- PORTADA -->
<div class="cover-page">
  <div class="cover-ornament">✦ ✦ ✦</div>
  <h1 class="cover-title">${book.honoree_name}</h1>
  <div class="cover-line"></div>
  <p class="cover-subtitle">Un libro de memorias</p>
  <p class="cover-relationship">${book.honoree_relationship || 'Escrito con amor por su familia'}</p>
</div>

<!-- PÁGINA DE CORTESÍA -->
<div class="prelim-page"></div>

<!-- COPYRIGHT -->
<div class="prelim-page">
  <div class="copyright">
    <p>✦</p>
    <p>&nbsp;</p>
    <p>© ${new Date().getFullYear()} Familia de ${book.honoree_name}</p>
    <p>Todos los derechos reservados.</p>
    <p>&nbsp;</p>
    <p>Este libro de memorias ha sido creado con amor,</p>
    <p>recogiendo las voces de quienes más le quieren.</p>
    <p>&nbsp;</p>
    <p>Ninguna parte de esta publicación puede ser reproducida</p>
    <p>sin el permiso expreso de la familia.</p>
    <p>&nbsp;</p>
    <p>&nbsp;</p>
    <p style="font-style: italic; color: #B8A48C;">Creado con Libro de Memorias</p>
    <p style="font-size: 8pt; color: #B8A48C;">librodememorias.com</p>
  </div>
</div>

<!-- DEDICATORIA -->
<div class="prelim-page">
  <div class="dedication">
    Para ${book.honoree_name},<br>
    cuyas historias merecen ser eternas.
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
<div class="prologue-page">
  <h2 class="section-title">Prólogo</h2>
  <div class="prologue-text">
    <p>${prologueText}</p>
  </div>
</div>
`
    }
  }
  
  // CAPÍTULOS
  let chapterNum = 0
  for (const chapter of chapters) {
    if (chapter.chapter_type === 'intro') {
      if (chapter.generated_opening) {
        html += `
<div class="prologue-page">
  <h2 class="section-title">Introducción</h2>
  <div class="prologue-text">
    <p>${chapter.generated_opening}</p>
  </div>
</div>
`
      }
    } else if (chapter.chapter_type === 'chapter') {
      chapterNum++
      
      // Página de apertura del capítulo
      html += `
<div class="chapter-opener">
  <div class="chapter-number">Capítulo ${chapterNum}</div>
  <h2 class="chapter-title">${chapter.title}</h2>
`
      if (chapter.subtitle) {
        html += `  <p class="chapter-subtitle">${chapter.subtitle}</p>\n`
      }
      html += `  <div class="chapter-ornament">◆</div>
</div>
`
      
      // Apertura del capítulo
      if (chapter.generated_opening) {
        html += `<div class="chapter-opening">${chapter.generated_opening}</div>\n`
      }
      
      // Memorias
      const chapterMemories = memories.filter(m => chapter.memory_ids && chapter.memory_ids.includes(m.id))
      
      for (let i = 0; i < chapterMemories.length; i++) {
        const memory = chapterMemories[i]
        const memoryText = getMemoryText(memory)
        
        // Dividir el texto en párrafos
        const paragraphs = memoryText.split(/\n\n+/).filter(p => p.trim())
        
        html += `<div class="memory-block">\n`
        html += `  <div class="memory-attribution">${memory.contributor_name}, ${memory.contributor_relationship || 'familiar'}</div>\n`
        
        for (const para of paragraphs) {
          html += `  <p class="memory-text">${para.trim()}</p>\n`
        }
        
        html += `</div>\n`
        
        // Transición
        if (i < chapterMemories.length - 1 && chapter.generated_transitions) {
          const nextMemory = chapterMemories[i + 1]
          const transitionKey = `${memory.id}_to_${nextMemory.id}`
          const transition = chapter.generated_transitions[transitionKey]
          
          if (transition) {
            html += `<p class="transition-text">${transition}</p>\n`
          }
        }
      }
      
      // Cierre del capítulo
      if (chapter.generated_closing) {
        html += `<div class="chapter-closing">${chapter.generated_closing}</div>\n`
      }
    } else if (chapter.chapter_type === 'epilogue') {
      html += `
<div class="prologue-page">
  <h2 class="section-title">Epílogo</h2>
  <div class="epilogue-text">
    <p>${chapter.generated_opening || ''}</p>
  </div>
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
  
  const year = new Date().getFullYear()
  
  html += `
<div class="colophon">
  <div class="colophon-ornament">❦</div>
  <p>Este libro fue compuesto con las memorias</p>
  <p>compartidas por quienes más quieren a ${book.honoree_name}.</p>
  <p>&nbsp;</p>
  <p>Terminado de editar el ${date}.</p>
  <p>&nbsp;</p>
  <p>Que estas palabras perduren</p>
  <p>como perdura el amor que las inspiró.</p>
  <div class="colophon-brand">
    <p>✦</p>
    <p>Libro de Memorias</p>
    <p style="font-size: 8pt;">librodememorias.com</p>
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
