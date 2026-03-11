import express from 'express'
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xuyacfbwqzqnxojgzqmw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('[INIT] ❌ FATAL: SUPABASE_SERVICE_ROLE_KEY no está configurada')
  process.exit(1)
}

console.log('[INIT] 🚀 Iniciando servicio PDF (Puppeteer)...')
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'libro-memorias-pdf', engine: 'puppeteer-v2', timestamp: new Date().toISOString() })
})

app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] 📖 Nueva solicitud de PDF`)
  
  try {
    const { bookId } = req.body
    if (!bookId) return res.status(400).json({ error: 'bookId requerido' })
    
    console.log(`[PDF] 📚 Generando libro: ${bookId}`)
    
    // Obtener datos
    const { data: book, error: bookError } = await supabase
      .from('memory_books')
      .select('*, book_generation_config (*)')
      .eq('id', bookId)
      .single()
    
    if (bookError || !book) return res.status(404).json({ error: 'Libro no encontrado' })
    
    const config = book.book_generation_config?.[0] || {}
    console.log(`[PDF] ✅ Libro: ${book.title}`)
    
    const { data: chapters } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number')
    
    if (!chapters?.length) return res.status(400).json({ error: 'No hay capítulos generados' })
    
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'ready')
      .order('created_at')
    
    if (!memories?.length) return res.status(400).json({ error: 'No hay memorias aprobadas' })
    
    console.log(`[PDF] ✅ ${chapters.length} capítulos, ${memories.length} memorias`)
    
    // Procesar fotos
    const memoriesWithPhotos = await Promise.all(memories.map(async (memory) => {
      if (memory.image_url) {
        try {
          const urlParts = memory.image_url.split('/memory-photos/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]
            const { data } = await supabase.storage.from('memory-photos').createSignedUrl(filePath, 3600)
            if (data?.signedUrl) return { ...memory, signedPhotoUrl: data.signedUrl }
          }
        } catch (e) { console.log(`[PDF] ⚠️ Foto error: ${memory.id}`) }
      }
      return memory
    }))
    
    // Generar HTML
    const html = generateBookHTML(book, config, chapters, memoriesWithPhotos)
    
    // Puppeteer
    console.log('[PDF] 🖨️ Iniciando Puppeteer...')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    
    // Esperar fuentes
    await page.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 1000))
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1in', right: '0.85in', bottom: '1in', left: '0.85in' }
    })
    
    await browser.close()
    
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log(`[PDF] ✅ PDF: ${sizeKB} KB`)
    
    // Subir
    const fileName = `libro-${bookId}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-books')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })
    
    if (uploadError) throw new Error('Error al subir PDF: ' + uploadError.message)
    
    const { data: { publicUrl } } = supabase.storage.from('generated-books').getPublicUrl(fileName)
    
    await supabase.from('memory_books').update({
      generated_pdf_url: publicUrl,
      last_generated_at: new Date().toISOString(),
      generations_count: (book.generations_count || 0) + 1,
      status: 'ready'
    }).eq('id', bookId)
    
    const totalTime = Math.round((Date.now() - startTime) / 1000)
    console.log(`[PDF] 🎉 ¡ÉXITO! (${totalTime}s)`)
    
    res.json({
      success: true,
      pdfUrl: publicUrl,
      bookId,
      title: book.title,
      format: 'LEGADO',
      stats: { memoriesCount: memories.length, chaptersCount: chapters.length, sizeKB, totalTime: `${totalTime}s` }
    })
    
  } catch (error) {
    console.error(`[PDF] ❌ ERROR:`, error.message)
    res.status(500).json({ error: error.message })
  }
})

function generateBookHTML(book, config, chapters, memories) {
  const getText = (m) => m.enriched_text || m.original_text || m.transcription || ''
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page { size: A4; margin: 0; }
    
    body {
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 11pt;
      line-height: 1.75;
      color: #1A1208;
      background: #FFFDF8;
    }
    
    .page {
      width: 100%;
      min-height: 100%;
      padding: 0;
      page-break-after: always;
      background: #FFFDF8;
      box-sizing: border-box;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    
    .page-center {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: calc(297mm - 50mm);
    }
    
    /* PORTADA */
    .cover { background: linear-gradient(180deg, #FAF7F2 0%, #F5EFE6 100%); }
    .cover-ornament { font-size: 20pt; color: #C9A961; letter-spacing: 0.5em; margin-bottom: 50px; }
    .cover-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 38pt; font-weight: 500; color: #1A1208; margin-bottom: 15px; }
    .cover-line { width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #C9A961, transparent); margin: 20px 0; }
    .cover-subtitle { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16pt; font-style: italic; color: #6B5D4D; }
    .cover-relationship { font-size: 12pt; font-style: italic; color: #8B7355; margin-top: 40px; }
    
    /* DEDICATORIA */
    .dedication-ornament { font-size: 24pt; color: #C9A961; margin-bottom: 30px; }
    .dedication-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18pt; font-style: italic; color: #4A4035; line-height: 2; }
    
    /* COPYRIGHT */
    .copyright { margin-top: auto; text-align: center; }
    .copyright p { font-size: 9pt; color: #8B7355; margin: 3px 0; }
    
    /* CAPÍTULOS */
    .chapter-header { text-align: center; padding-top: 60px; margin-bottom: 40px; }
    .chapter-number { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 10pt; color: #C9A961; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 10px; }
    .chapter-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26pt; font-weight: 500; color: #1A1208; margin-bottom: 8px; }
    .chapter-subtitle { font-size: 12pt; font-style: italic; color: #6B5D4D; }
    .chapter-ornament { font-size: 14pt; color: #C9A961; margin-top: 15px; }
    .chapter-opening { font-style: italic; color: #4A4035; text-align: center; margin: 30px 20px 40px; }
    
    /* MEMORIAS */
    .memory { margin-bottom: 30px; }
    .memory-attribution { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 10pt; font-style: italic; color: #8B7355; margin-bottom: 10px; }
    .memory-text { 
      text-align: justify; 
      margin-bottom: 8px; 
      text-indent: 1.5em;
      overflow-wrap: break-word;
      word-wrap: break-word;
      hyphens: auto;
    }
    .memory-text:first-of-type { text-indent: 0; }
    .memory-photo-container { 
      width: 100%; 
      text-align: center; 
      margin: 30px 0; 
      padding: 20px 0;
      page-break-inside: avoid;
    }
    .memory-photo { 
      max-width: 80%; 
      max-height: 400px;
      height: auto; 
      margin: 0 auto; 
      display: block; 
      border-radius: 4px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .transition { font-style: italic; color: #6B5D4D; text-align: center; margin: 25px 40px; font-size: 10pt; }
    .chapter-closing { font-style: italic; text-align: center; color: #4A4035; margin: 40px 20px 10px; }
    .chapter-closing-ornament { text-align: center; color: #C9A961; font-size: 12pt; margin-top: 15px; }
    
    /* SECCIONES */
    .section-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20pt; text-align: center; letter-spacing: 0.15em; text-transform: uppercase; color: #1A1208; margin-top: 80px; margin-bottom: 10px; }
    .section-line { width: 60px; height: 1px; background: #C9A961; margin: 0 auto 40px; }
    .section-text { font-style: italic; color: #3D352A; line-height: 1.9; }
    
    /* COLOFÓN */
    .colophon { text-align: center; }
    .colophon-ornament { font-size: 24pt; color: #C9A961; margin-bottom: 40px; }
    .colophon p { font-size: 11pt; color: #8B7355; margin: 5px 0; }
    .colophon-brand { margin-top: 50px; font-size: 9pt; font-style: italic; }
  </style>
</head>
<body>

<!-- PORTADA -->
<div class="page cover">
  <div class="page-center">
    <div class="cover-ornament">✦ ✦ ✦</div>
    <h1 class="cover-title">${book.honoree_name}</h1>
    <div class="cover-line"></div>
    <p class="cover-subtitle">Un libro de memorias</p>
    <p class="cover-relationship">${book.honoree_relationship || 'Escrito con amor por su familia'}</p>
  </div>
</div>

<!-- PÁGINA EN BLANCO -->
<div class="page"></div>

<!-- COPYRIGHT -->
<div class="page">
  <div class="page-center">
    <div class="copyright">
      <p>✦</p>
      <p>&nbsp;</p>
      <p>© ${year} Familia de ${book.honoree_name}</p>
      <p>Todos los derechos reservados.</p>
      <p>&nbsp;</p>
      <p>Este libro de memorias ha sido creado con amor,</p>
      <p>recogiendo las voces de quienes más le quieren.</p>
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      <p style="font-style: italic;">Creado con Libro de Memorias</p>
      <p style="font-size: 8pt;">librodememorias.com</p>
    </div>
  </div>
</div>

<!-- DEDICATORIA -->
<div class="page">
  <div class="page-center">
    <div class="dedication-ornament">❦</div>
    <p class="dedication-text">Para ${book.honoree_name},<br>cuyas historias merecen ser eternas.</p>
  </div>
</div>
`

  // Prólogo
  if (config.include_prologue) {
    const prologueText = config.prologue_type === 'manual' ? config.prologue_manual_text : config.prologue_generated_text
    if (prologueText) {
      html += `
<div class="page">
  <h2 class="section-title">Prólogo</h2>
  <div class="section-line"></div>
  <div class="section-text">${prologueText}</div>
</div>
`
    }
  }

  // Capítulos
  let chapterNum = 0
  for (const chapter of chapters) {
    if (chapter.chapter_type === 'intro' && chapter.generated_opening) {
      html += `
<div class="page">
  <h2 class="section-title">Introducción</h2>
  <div class="section-line"></div>
  <div class="section-text">${chapter.generated_opening}</div>
</div>
`
    } else if (chapter.chapter_type === 'chapter') {
      chapterNum++
      const chapterMemories = memories.filter(m => chapter.memory_ids?.includes(m.id))
      
      html += `
<div class="page">
  <div class="chapter-header">
    <div class="chapter-number">Capítulo ${chapterNum}</div>
    <h2 class="chapter-title">${chapter.title}</h2>
    ${chapter.subtitle ? `<p class="chapter-subtitle">${chapter.subtitle}</p>` : ''}
    <div class="chapter-ornament">◆</div>
  </div>
  ${chapter.generated_opening ? `<p class="chapter-opening">${chapter.generated_opening}</p>` : ''}
`
      
      for (let i = 0; i < chapterMemories.length; i++) {
        const memory = chapterMemories[i]
        const text = getText(memory)
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
        
        html += `  <div class="memory">
    <p class="memory-attribution">— ${memory.contributor_name}, ${memory.contributor_relationship || 'familiar'}</p>
    ${memory.signedPhotoUrl ? `<div class="memory-photo-container"><img class="memory-photo" src="${memory.signedPhotoUrl}" alt="Foto de ${memory.contributor_name}"></div>` : ''}
    ${paragraphs.map(p => `<p class="memory-text">${p.trim()}</p>`).join('\n    ')}
  </div>
`
        
        if (i < chapterMemories.length - 1 && chapter.generated_transitions) {
          const nextMemory = chapterMemories[i + 1]
          const transition = chapter.generated_transitions[`${memory.id}_to_${nextMemory.id}`]
          if (transition) html += `  <p class="transition">${transition}</p>\n`
        }
      }
      
      if (chapter.generated_closing) {
        html += `  <p class="chapter-closing">${chapter.generated_closing}</p>
  <p class="chapter-closing-ornament">◆</p>
`
      }
      
      html += `</div>\n`
      
    } else if (chapter.chapter_type === 'epilogue') {
      html += `
<div class="page">
  <h2 class="section-title">Epílogo</h2>
  <div class="section-line"></div>
  <div class="section-text">${chapter.generated_opening || ''}</div>
</div>
`
    }
  }

  // Colofón
  html += `
<div class="page">
  <div class="page-center">
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
        <p>librodememorias.com</p>
      </div>
    </div>
  </div>
</div>

</body>
</html>`

  return html
}

app.listen(PORT, () => {
  console.log(`🚀 PDF Service (Puppeteer v2) running on port ${PORT}`)
})
