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

console.log('[INIT] 🚀 Iniciando servicio PDF Editorial...')
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================
// BOOK CSS - Diseño Editorial Profesional
// ============================================
const BOOK_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Poppins:wght@300;400&display=swap');

@page {
  size: 6in 9in;
  margin: 0;
}

* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Lora', Georgia, serif;
  color: #1A1A1A;
  background: white;
}

/* === PÁGINA BASE === */
.page {
  width: 6in;
  height: 9in;
  position: relative;
  page-break-after: always;
  overflow: hidden;
  box-sizing: border-box;
}

/* Páginas impares (derecha): margen inner a la izquierda */
.page:nth-child(odd) {
  padding: 0.875in 0.75in 0.875in 0.875in;
}

/* Páginas pares (izquierda): margen inner a la derecha */
.page:nth-child(even) {
  padding: 0.875in 0.875in 0.875in 0.75in;
}

/* Capítulos siempre en página derecha (impar) */
.chapter-start {
  break-before: recto;
}

/* === RUNNING HEADER === */
.running-header {
  position: absolute;
  top: 0.5in;
  left: 0.75in;
  right: 0.75in;
  display: flex;
  justify-content: space-between;
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 7.5pt;
  color: #6B6B6B;
  border-bottom: 0.4px solid #D4C4A0;
  padding-bottom: 4px;
}

/* === NÚMERO DE PÁGINA === */
.page-number {
  position: absolute;
  bottom: 0.5in;
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8pt;
  color: #9A8A6A;
}
.page-number.left { left: 0.75in; }
.page-number.right { right: 0.75in; }

/* === CUERPO DE TEXTO === */
.body-text {
  font-family: 'Lora', Georgia, serif;
  font-size: 11pt;
  line-height: 1.6;
  text-align: justify;
  color: #1A1A1A;
  hyphens: auto;
}
.body-text p {
  text-indent: 1.5em;
  margin: 0;
}
.body-text p.no-indent {
  text-indent: 0;
}

/* === APERTURA DE CAPÍTULO === */
.chapter-opener {
  text-align: center;
  padding-top: 0.5in;
  padding-bottom: 0.35in;
}
.chapter-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8pt;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #C9A96E;
  margin-bottom: 0.1in;
}
.gold-rule {
  border: none;
  border-top: 0.5px solid #D4C4A0;
  width: 1.5in;
  margin: 0.1in auto;
}
.gold-rule-narrow {
  border: none;
  border-top: 0.5px solid #D4C4A0;
  width: 1.2in;
  margin: 0.1in auto;
}
.chapter-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 22pt;
  line-height: 1.25;
  color: #1A1A1A;
  margin: 0.1in 0 0.05in;
  font-weight: 400;
}
.chapter-subtitle {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 11pt;
  color: #6B6B6B;
  margin-bottom: 0;
}

/* === ORNAMENTO === */
.ornament {
  font-family: 'Lora', Georgia, serif;
  font-size: 10pt;
  color: #C9A96E;
  text-align: center;
  margin: 0.18in 0;
}
.ornament-large {
  font-family: 'Lora', Georgia, serif;
  font-size: 16pt;
  color: #C9A96E;
  text-align: center;
  margin: 0.25in 0;
}

/* === SEPARADOR PUNTOS === */
.testimony-dots {
  text-align: center;
  color: #C9A96E;
  font-size: 8pt;
  margin: 0.14in 0 0;
}
.testimony-dots::before {
  content: '· · ·';
  letter-spacing: 0.3em;
}

/* === TESTIMONIO DE FAMILIAR === */
.testimony {
  font-family: 'Lora', Georgia, serif;
  font-size: 10.5pt;
  line-height: 1.57;
  text-align: justify;
  padding: 0 0.35in;
  color: #1A1A1A;
  margin: 0.08in 0 0;
}
.testimony-attribution {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8pt;
  letter-spacing: 0.08em;
  color: #C9A96E;
  text-align: center;
  margin: 0.05in 0 0.18in;
}

/* === PULL-QUOTE === */
.pullquote {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 11.5pt;
  line-height: 1.57;
  text-align: center;
  padding: 0 0.5in;
  color: #1A1A1A;
  margin: 0.25in 0;
}

/* === FOTOS === */
.photo-block {
  margin: 0.25in 0;
  text-align: center;
  page-break-inside: avoid;
}
.photo-block.photo-full {
  width: 100%;
}
.photo-block.photo-medium {
  width: 80%;
  margin-left: auto;
  margin-right: auto;
}
.photo-block.photo-small {
  width: 55%;
  margin-left: auto;
  margin-right: auto;
}
.photo-block img {
  width: 100%;
  height: auto;
  display: block;
  border: 0.5px solid #D4C4A0;
}
.photo-block img.photo-rounded {
  border-radius: 2px;
}
.photo-caption {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-style: italic;
  font-size: 8pt;
  color: #6B6B6B;
  text-align: center;
  margin-top: 0.06in;
  line-height: 1.4;
}
.photo-attribution {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 7pt;
  color: #9A8A6A;
  text-align: center;
  margin-top: 2px;
}

/* === PORTADA === */
.cover-page {
  width: 6in;
  height: 9in;
  background-color: #1C1C1C;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  page-break-after: always;
  overflow: hidden;
  padding: 0;
  margin: 0;
}
.cover-band-top {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: #C9A96E;
}
.cover-band-bottom {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: #C9A96E;
}
.cover-border {
  position: absolute;
  inset: 0.25in;
  border: 0.5px solid #C9A96E;
  pointer-events: none;
}
.cover-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0.7in 0.5in;
  position: relative;
  z-index: 1;
}
.cover-ornament-top {
  font-family: 'Lora', Georgia, serif;
  font-size: 18pt;
  color: #C9A96E;
  margin-bottom: 0.15in;
}
.cover-supra {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8pt;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #E8D5A3;
  margin-bottom: 0.1in;
}
.cover-rule {
  border: none;
  border-top: 0.4px solid #C9A96E;
  width: 1in;
  margin: 0 auto 0.2in;
}
.cover-name {
  font-family: 'Lora', Georgia, serif;
  font-size: 32pt;
  line-height: 1.2;
  color: white;
  text-align: center;
  font-weight: 400;
  margin-bottom: 0.1in;
}
.cover-rule-bottom {
  border: none;
  border-top: 0.6px solid #C9A96E;
  width: 1.2in;
  margin: 0 auto 0.15in;
}
.cover-subtitle {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 12pt;
  color: #E8D5A3;
  text-align: center;
}
.cover-center-ornament {
  font-family: 'Lora', Georgia, serif;
  font-size: 40pt;
  color: #2A2A2A;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
}
.cover-footer {
  position: absolute;
  bottom: 0.35in;
  text-align: center;
  width: 100%;
}
.cover-years {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 9pt;
  color: #6B6B6B;
  letter-spacing: 0.1em;
  margin-bottom: 0.1in;
}
.cover-brand {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 7pt;
  letter-spacing: 0.15em;
  color: #C9A96E;
}

/* === PÁGINA LEGAL / COLOFÓN === */
.legal-page {
  width: 6in;
  height: 9in;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.875in;
  box-sizing: border-box;
  overflow: hidden;
  page-break-after: always;
}
.legal-title {
  font-family: 'Lora', Georgia, serif;
  font-size: 13pt;
  color: #1A1A1A;
  margin-bottom: 0.05in;
}
.legal-subtitle {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 10pt;
  color: #6B6B6B;
  margin-bottom: 0.3in;
}
.legal-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8.5pt;
  line-height: 1.65;
  color: #6B6B6B;
  margin-bottom: 0.08in;
}
.legal-brand {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 8pt;
  letter-spacing: 0.12em;
  color: #C9A96E;
  margin-top: 0.25in;
}

/* === DEDICATORIA === */
.dedication-page {
  width: 6in;
  height: 9in;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.875in;
  box-sizing: border-box;
  overflow: hidden;
  page-break-after: always;
}
.dedication-text {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 14pt;
  line-height: 1.57;
  color: #1A1A1A;
  max-width: 4in;
}

/* === INTRODUCCIÓN / EPÍLOGO === */
.section-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 9pt;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #C9A96E;
  text-align: center;
  margin-bottom: 0.1in;
  margin-top: 0.6in;
}
.section-body {
  font-family: 'Lora', Georgia, serif;
  font-size: 10.5pt;
  line-height: 1.62;
  text-align: justify;
  color: #1A1A1A;
  hyphens: auto;
  margin-bottom: 0.1in;
}
.closing-italic {
  font-family: 'Lora', Georgia, serif;
  font-style: italic;
  font-size: 11pt;
  line-height: 1.62;
  text-align: center;
  padding: 0 0.5in;
  color: #1A1A1A;
  margin: 0.25in 0;
}
`

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'libro-memorias-pdf', 
    engine: 'editorial-v1',
    format: '6x9 inches',
    timestamp: new Date().toISOString() 
  })
})

// ============================================
// GENERATE PDF ENDPOINT
// ============================================
app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] 📖 Nueva solicitud de PDF Editorial`)
  
  try {
    const { bookId } = req.body
    if (!bookId) return res.status(400).json({ error: 'bookId requerido' })
    
    console.log(`[PDF] 📚 Generando libro: ${bookId}`)
    
    // Obtener datos del libro
    const { data: book, error: bookError } = await supabase
      .from('memory_books')
      .select('*, book_generation_config (*)')
      .eq('id', bookId)
      .single()
    
    if (bookError || !book) return res.status(404).json({ error: 'Libro no encontrado' })
    
    const config = book.book_generation_config?.[0] || {}
    console.log(`[PDF] ✅ Libro: ${book.title}`)
    
    // Obtener capítulos
    const { data: chapters } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number')
    
    if (!chapters?.length) return res.status(400).json({ error: 'No hay capítulos generados' })
    
    // Obtener memorias
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'ready')
      .order('created_at')
    
    if (!memories?.length) return res.status(400).json({ error: 'No hay memorias aprobadas' })
    
    console.log(`[PDF] ✅ ${chapters.length} capítulos, ${memories.length} memorias`)
    
    // Procesar URLs de fotos (signed URLs)
    const memoriesWithPhotos = await Promise.all(memories.map(async (memory) => {
      if (memory.image_url) {
        try {
          const urlParts = memory.image_url.split('/memory-photos/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]
            const { data } = await supabase.storage.from('memory-photos').createSignedUrl(filePath, 3600)
            if (data?.signedUrl) return { ...memory, signedPhotoUrl: data.signedUrl }
          }
        } catch (e) { 
          console.log(`[PDF] ⚠️ Foto error: ${memory.id}`) 
        }
      }
      return memory
    }))
    
    // Generar HTML
    const html = generateBookHTML(book, config, chapters, memoriesWithPhotos)
    
    // Generar PDF con Puppeteer
    console.log('[PDF] 🖨️ Iniciando Puppeteer...')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
    
    // Esperar carga de fuentes
    await page.evaluate(() => document.fonts.ready)
    await new Promise(r => setTimeout(r, 1500))
    
    const pdfBuffer = await page.pdf({
      width: '6in',
      height: '9in',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })
    
    await browser.close()
    
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log(`[PDF] ✅ PDF generado: ${sizeKB} KB`)
    
    // Subir a Supabase Storage
    const fileName = `libro-${bookId}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('generated-books')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })
    
    if (uploadError) throw new Error('Error al subir PDF: ' + uploadError.message)
    
    const { data: { publicUrl } } = supabase.storage.from('generated-books').getPublicUrl(fileName)
    
    // Actualizar registro del libro
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
      format: '6x9_EDITORIAL',
      stats: { 
        memoriesCount: memories.length, 
        chaptersCount: chapters.length, 
        sizeKB, 
        totalTime: `${totalTime}s` 
      }
    })
    
  } catch (error) {
    console.error(`[PDF] ❌ ERROR:`, error.message)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// HTML GENERATION FUNCTIONS
// ============================================

function generateBookHTML(book, config, chapters, memories) {
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <style>${BOOK_CSS}</style>
</head>
<body>
`

  // 1. PORTADA
  html += renderCoverPage(book)
  
  // 2. PÁGINA EN BLANCO
  html += renderBlankPage()
  
  // 3. PÁGINA LEGAL
  html += renderLegalPage(book, year)
  
  // 4. DEDICATORIA
  html += renderDedicationPage(book)
  
  // 5. PRÓLOGO (si existe)
  if (config.include_prologue) {
    const prologueText = config.prologue_type === 'manual' 
      ? config.prologue_manual_text 
      : config.prologue_generated_text
    if (prologueText) {
      html += renderSectionPage('PRÓLOGO', prologueText)
    }
  }
  
  // 6. CAPÍTULOS
  let chapterNum = 0
  let pageNum = 5 // Empezamos después de portada, blanco, legal, dedicatoria
  
  for (const chapter of chapters) {
    if (chapter.chapter_type === 'intro' && chapter.generated_opening) {
      html += renderSectionPage('INTRODUCCIÓN', chapter.generated_opening)
      pageNum++
    } else if (chapter.chapter_type === 'chapter') {
      chapterNum++
      const chapterMemories = memories.filter(m => chapter.memory_ids?.includes(m.id))
      html += renderChapter(chapter, chapterNum, chapterMemories, book.honoree_name, pageNum)
      pageNum += Math.ceil(chapterMemories.length / 2) + 1
    } else if (chapter.chapter_type === 'epilogue' && chapter.generated_opening) {
      html += renderSectionPage('EPÍLOGO', chapter.generated_opening)
      pageNum++
    }
  }
  
  // 7. COLOFÓN
  html += renderColophonPage(book, date)
  
  html += `
</body>
</html>`

  return html
}

function renderCoverPage(book) {
  return `
<!-- PORTADA -->
<div class="cover-page">
  <div class="cover-band-top"></div>
  <div class="cover-band-bottom"></div>
  <div class="cover-border"></div>
  <div class="cover-center-ornament">✦</div>
  <div class="cover-content">
    <p class="cover-ornament-top">✦ ✦ ✦</p>
    <p class="cover-supra">UN LIBRO DE MEMORIAS</p>
    <hr class="cover-rule">
    <h1 class="cover-name">${book.honoree_name}</h1>
    <hr class="cover-rule-bottom">
    <p class="cover-subtitle">Memorias de una vida bien vivida</p>
  </div>
  <div class="cover-footer">
    <p class="cover-years">${book.birth_year || ''} ${book.birth_year && book.death_year ? '—' : ''} ${book.death_year || ''}</p>
    <p class="cover-brand">LEGADO · librodememorias.com</p>
  </div>
</div>
`
}

function renderBlankPage() {
  return `
<!-- PÁGINA EN BLANCO -->
<div class="page"></div>
`
}

function renderLegalPage(book, year) {
  return `
<!-- PÁGINA LEGAL -->
<div class="page">
  <div class="legal-page">
    <p class="legal-title">${book.honoree_name}</p>
    <p class="legal-subtitle">Un libro de memorias</p>
    <p class="legal-text">© ${year} Familia de ${book.honoree_name}</p>
    <p class="legal-text">Todos los derechos reservados.</p>
    <p class="legal-text" style="margin-top: 0.2in;">Este libro de memorias ha sido creado con amor,</p>
    <p class="legal-text">recogiendo las voces de quienes más le quieren.</p>
    <p class="legal-brand">Creado con LEGADO</p>
    <p class="legal-text" style="font-size: 7pt;">librodememorias.com</p>
  </div>
</div>
`
}

function renderDedicationPage(book) {
  return `
<!-- DEDICATORIA -->
<div class="page">
  <div class="dedication-page">
    <p class="dedication-text">Para ${book.honoree_name},<br>cuyas historias merecen ser eternas.</p>
  </div>
</div>
`
}

function renderSectionPage(title, content) {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  return `
<!-- ${title} -->
<div class="page">
  <p class="section-label">${title}</p>
  <hr class="gold-rule">
  <div class="section-body">
    ${paragraphs.map((p, i) => `<p class="${i === 0 ? 'no-indent' : ''}">${p.trim()}</p>`).join('\n    ')}
  </div>
</div>
`
}

function renderChapter(chapter, chapterNum, memories, protagonistName, pageNum) {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const romanNumeral = romanNumerals[chapterNum - 1] || chapterNum
  
  let html = `
<!-- CAPÍTULO ${chapterNum} -->
<div class="page chapter-start">
  <div class="running-header">
    <span>${protagonistName}</span>
    <span>${chapter.title}</span>
  </div>
  <div class="chapter-opener">
    <p class="chapter-label">CAPÍTULO ${romanNumeral}</p>
    <hr class="gold-rule">
    <h2 class="chapter-title">${chapter.title}</h2>
    ${chapter.subtitle ? `<p class="chapter-subtitle">${chapter.subtitle}</p>` : ''}
  </div>
`

  // Opening narrativo si existe
  if (chapter.generated_opening) {
    html += `  <div class="body-text">
    <p class="no-indent">${chapter.generated_opening}</p>
  </div>
`
  }

  // Testimonios/Memorias
  for (let i = 0; i < memories.length; i++) {
    const memory = memories[i]
    const text = memory.enriched_text || memory.original_text || memory.transcription || ''
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    
    html += `
  <div class="testimony-dots"></div>
  <div class="testimony">
    ${paragraphs.map((p, idx) => `<p${idx === 0 ? '' : ' style="text-indent: 1.5em;"'}>${p.trim()}</p>`).join('\n    ')}
  </div>
  <p class="testimony-attribution">— ${memory.contributor_name}, ${memory.contributor_relationship || 'familiar'}</p>
`

    // Foto si existe
    if (memory.signedPhotoUrl) {
      html += `
  <div class="photo-block photo-medium">
    <img src="${memory.signedPhotoUrl}" alt="Foto de ${memory.contributor_name}">
    <p class="photo-attribution">— ${memory.contributor_name}</p>
  </div>
`
    }

    // Transición si existe
    if (i < memories.length - 1 && chapter.generated_transitions) {
      const nextMemory = memories[i + 1]
      const transition = chapter.generated_transitions[`${memory.id}_to_${nextMemory.id}`]
      if (transition) {
        html += `  <p class="closing-italic">${transition}</p>\n`
      }
    }
  }

  // Closing del capítulo
  if (chapter.generated_closing) {
    html += `  <p class="closing-italic">${chapter.generated_closing}</p>\n`
  }

  html += `  <p class="ornament">◆</p>
  <div class="page-number right">${pageNum}</div>
</div>
`

  return html
}

function renderColophonPage(book, date) {
  return `
<!-- COLOFÓN -->
<div class="page">
  <div class="legal-page">
    <p class="ornament-large">❦</p>
    <p class="legal-text" style="margin-top: 0.3in;">Este libro fue compuesto con las memorias</p>
    <p class="legal-text">compartidas por quienes más quieren a ${book.honoree_name}.</p>
    <p class="legal-text" style="margin-top: 0.2in;">Terminado de editar el ${date}.</p>
    <p class="legal-text" style="margin-top: 0.2in;">Que estas palabras perduren</p>
    <p class="legal-text">como perdura el amor que las inspiró.</p>
    <p class="legal-brand" style="margin-top: 0.4in;">✦</p>
    <p class="legal-text" style="font-style: italic; margin-top: 0.1in;">Libro de Memorias</p>
    <p class="legal-text" style="font-size: 7pt;">librodememorias.com</p>
  </div>
</div>
`
}

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 PDF Editorial Service v1 running on port ${PORT}`)
  console.log(`📐 Format: 6x9 inches (Lulu Memoria)`)
})
