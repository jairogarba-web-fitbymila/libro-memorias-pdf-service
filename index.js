import express from 'express'
import ReactPDF from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import cors from 'cors'
import dotenv from 'dotenv'
import React from 'react'
import BookDocument from './book-template.js'

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

console.log('[INIT] 🚀 Iniciando servicio PDF con React-PDF...')
console.log('[INIT] 📡 Supabase URL:', SUPABASE_URL)
console.log('[INIT] 🔑 Service key:', SUPABASE_KEY ? 'Configurado ✅' : 'FALTA ❌')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'libro-memorias-pdf', 
    engine: 'react-pdf',
    timestamp: new Date().toISOString() 
  })
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
    
    // 4. Generar URLs firmadas para las fotos
    console.log('[PDF] 📷 Procesando fotos...')
    const memoriesWithPhotos = await Promise.all(memories.map(async (memory) => {
      if (memory.image_url) {
        try {
          const urlParts = memory.image_url.split('/memory-photos/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0]
            const { data } = await supabase.storage
              .from('memory-photos')
              .createSignedUrl(filePath, 3600)
            
            if (data?.signedUrl) {
              return { ...memory, signedPhotoUrl: data.signedUrl }
            }
          }
        } catch (e) {
          console.log(`[PDF] ⚠️ No se pudo obtener foto para memoria ${memory.id}`)
        }
      }
      return memory
    }))
    
    const photosCount = memoriesWithPhotos.filter(m => m.signedPhotoUrl).length
    console.log(`[PDF] ✅ ${photosCount} fotos procesadas`)
    
    // 5. Generar PDF con React-PDF
    console.log('[PDF] 🎨 Generando PDF con React-PDF...')
    
    const document = React.createElement(BookDocument, {
      book,
      config,
      chapters,
      memories: memoriesWithPhotos
    })
    
    const pdfBuffer = await ReactPDF.renderToBuffer(document)
    
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    const sizeMB = (sizeKB / 1024).toFixed(2)
    console.log(`[PDF] ✅ PDF generado: ${sizeKB.toLocaleString()} KB (${sizeMB} MB)`)
    
    // 6. Subir a Supabase Storage
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
    
    // 7. Actualizar libro en BD
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
    
    // Formato según plan
    const formatNames = {
      'origen': 'MEMORIA',
      'legado': 'LEGADO', 
      'obra': 'ETERNO'
    }
    
    res.json({
      success: true,
      pdfUrl: publicUrl,
      bookId,
      title: book.title,
      format: formatNames[book.plan_type?.toLowerCase()] || 'MEMORIA',
      stats: {
        memoriesCount: memories.length,
        chaptersCount: chapters.filter(c => c.chapter_type === 'chapter').length,
        photosCount,
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PDF Service (React-PDF) running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
  console.log(`📄 Generate PDF: POST http://localhost:${PORT}/generate-pdf`)
})
