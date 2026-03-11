import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

const { createElement: h } = React

// Registrar fuentes elegantes
Font.register({
  family: 'Cormorant',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYrEtFmQ.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3WmX5slCNuHLi8bLeY9MK7whWMhyjYpHtKky2F7i4.ttf', fontWeight: 'normal', fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjQEl5fsA-crQk.ttf', fontWeight: 'semibold' },
  ]
})

Font.register({
  family: 'Crimson',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/crimsonpro/v23/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZ.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/crimsonpro/v23/q5uSsoa5M_tv7IihmnkabAReu49Y_Bo-HVKMBi4Ue5s7dtC.ttf', fontWeight: 'normal', fontStyle: 'italic' },
  ]
})

// Colores
const colors = {
  cream: '#FAF7F2',
  gold: '#C9A961',
  darkText: '#1A1208',
  midText: '#4A4035',
  softText: '#6B5D4D',
  lightText: '#8B7355',
}

// Estilos
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.cream,
    paddingTop: 72,
    paddingBottom: 72,
    paddingLeft: 54,
    paddingRight: 54,
    fontFamily: 'Crimson',
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.darkText,
  },
  
  // Portada
  coverPage: {
    backgroundColor: colors.cream,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 72,
  },
  coverOrnament: {
    fontSize: 20,
    color: colors.gold,
    letterSpacing: 12,
    marginBottom: 60,
  },
  coverTitle: {
    fontFamily: 'Cormorant',
    fontSize: 36,
    fontWeight: 'semibold',
    color: colors.darkText,
    textAlign: 'center',
    marginBottom: 16,
  },
  coverLine: {
    width: 120,
    height: 1,
    backgroundColor: colors.gold,
    marginVertical: 20,
  },
  coverSubtitle: {
    fontFamily: 'Cormorant',
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.softText,
    marginBottom: 8,
  },
  coverRelationship: {
    fontFamily: 'Crimson',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.lightText,
    marginTop: 40,
  },
  
  // Dedicatoria
  dedicationPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 72,
  },
  dedicationOrnament: {
    fontSize: 18,
    color: colors.gold,
    marginBottom: 30,
  },
  dedicationText: {
    fontFamily: 'Cormorant',
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.midText,
    textAlign: 'center',
    lineHeight: 2,
  },
  
  // Copyright
  copyrightPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    padding: 72,
  },
  copyrightText: {
    fontSize: 9,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 1.8,
    marginBottom: 4,
  },
  
  // Capítulos
  chapterOpener: {
    paddingTop: 80,
    marginBottom: 30,
    textAlign: 'center',
  },
  chapterNumber: {
    fontFamily: 'Cormorant',
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  chapterTitle: {
    fontFamily: 'Cormorant',
    fontSize: 24,
    fontWeight: 'semibold',
    color: colors.darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  chapterSubtitle: {
    fontFamily: 'Crimson',
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.softText,
    textAlign: 'center',
  },
  chapterOrnament: {
    fontSize: 12,
    color: colors.gold,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  chapterOpening: {
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.midText,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  
  // Memorias
  memoryBlock: {
    marginBottom: 24,
  },
  memoryAttribution: {
    fontFamily: 'Cormorant',
    fontSize: 10,
    fontStyle: 'italic',
    color: colors.lightText,
    marginBottom: 8,
  },
  memoryText: {
    textAlign: 'justify',
    marginBottom: 8,
    textIndent: 20,
  },
  memoryTextFirst: {
    textAlign: 'justify',
    marginBottom: 8,
    textIndent: 0,
  },
  memoryPhoto: {
    width: 250,
    marginVertical: 16,
    alignSelf: 'center',
  },
  
  // Transiciones
  transition: {
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.softText,
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 40,
  },
  
  // Cierre
  chapterClosing: {
    fontStyle: 'italic',
    textAlign: 'center',
    color: colors.midText,
    marginTop: 30,
    marginBottom: 10,
  },
  chapterClosingOrnament: {
    fontSize: 10,
    color: colors.gold,
    textAlign: 'center',
    marginTop: 12,
  },
  
  // Secciones
  sectionTitle: {
    fontFamily: 'Cormorant',
    fontSize: 18,
    color: colors.darkText,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 100,
    marginBottom: 8,
  },
  sectionLine: {
    width: 80,
    height: 1,
    backgroundColor: colors.gold,
    alignSelf: 'center',
    marginBottom: 40,
  },
  prologueText: {
    fontStyle: 'italic',
    lineHeight: 1.9,
    color: colors.midText,
  },
  
  // Colofón
  colophonPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 72,
  },
  colophonOrnament: {
    fontSize: 18,
    color: colors.gold,
    marginBottom: 40,
  },
  colophonText: {
    fontSize: 10,
    color: colors.lightText,
    textAlign: 'center',
    lineHeight: 2,
    marginBottom: 4,
  },
  colophonBrand: {
    marginTop: 50,
  },
})

// Crear documento
const createBookDocument = (book, config, chapters, memories) => {
  const getMemoryText = (memory) => {
    return memory.enriched_text || memory.original_text || memory.transcription || ''
  }
  
  const year = new Date().getFullYear()
  const date = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  let chapterNum = 0
  
  const pages = []
  
  // PORTADA
  pages.push(
    h(Page, { key: 'cover', size: 'A4', style: styles.page },
      h(View, { style: styles.coverPage },
        h(Text, { style: styles.coverOrnament }, '✦  ✦  ✦'),
        h(Text, { style: styles.coverTitle }, book.honoree_name),
        h(View, { style: styles.coverLine }),
        h(Text, { style: styles.coverSubtitle }, 'Un libro de memorias'),
        h(Text, { style: styles.coverRelationship }, 
          book.honoree_relationship || 'Escrito con amor por su familia'
        )
      )
    )
  )
  
  // PÁGINA EN BLANCO
  pages.push(
    h(Page, { key: 'blank', size: 'A4', style: styles.page },
      h(View, { style: { flex: 1 } })
    )
  )
  
  // COPYRIGHT
  pages.push(
    h(Page, { key: 'copyright', size: 'A4', style: styles.page },
      h(View, { style: styles.copyrightPage },
        h(Text, { style: styles.copyrightText }, '✦'),
        h(Text, { style: styles.copyrightText }, ' '),
        h(Text, { style: styles.copyrightText }, `© ${year} Familia de ${book.honoree_name}`),
        h(Text, { style: styles.copyrightText }, 'Todos los derechos reservados.'),
        h(Text, { style: styles.copyrightText }, ' '),
        h(Text, { style: styles.copyrightText }, 'Este libro de memorias ha sido creado con amor,'),
        h(Text, { style: styles.copyrightText }, 'recogiendo las voces de quienes más le quieren.'),
        h(Text, { style: styles.copyrightText }, ' '),
        h(Text, { style: { ...styles.copyrightText, fontStyle: 'italic' } }, 'Creado con Libro de Memorias'),
        h(Text, { style: { ...styles.copyrightText, fontSize: 8 } }, 'librodememorias.com')
      )
    )
  )
  
  // DEDICATORIA
  pages.push(
    h(Page, { key: 'dedication', size: 'A4', style: styles.page },
      h(View, { style: styles.dedicationPage },
        h(Text, { style: styles.dedicationOrnament }, '❦'),
        h(Text, { style: styles.dedicationText }, 
          `Para ${book.honoree_name},\ncuyas historias merecen ser eternas.`
        )
      )
    )
  )
  
  // PRÓLOGO
  if (config && config.include_prologue) {
    const prologueText = config.prologue_type === 'manual' 
      ? config.prologue_manual_text 
      : config.prologue_generated_text
    
    if (prologueText) {
      pages.push(
        h(Page, { key: 'prologue', size: 'A4', style: styles.page },
          h(Text, { style: styles.sectionTitle }, 'Prólogo'),
          h(View, { style: styles.sectionLine }),
          h(Text, { style: styles.prologueText }, prologueText)
        )
      )
    }
  }
  
  // CAPÍTULOS
  chapters.forEach((chapter, chapterIndex) => {
    if (chapter.chapter_type === 'intro') {
      if (chapter.generated_opening) {
        pages.push(
          h(Page, { key: `intro-${chapterIndex}`, size: 'A4', style: styles.page },
            h(Text, { style: styles.sectionTitle }, 'Introducción'),
            h(View, { style: styles.sectionLine }),
            h(Text, { style: styles.prologueText }, chapter.generated_opening)
          )
        )
      }
      return
    }
    
    if (chapter.chapter_type === 'chapter') {
      chapterNum++
      const chapterMemories = memories.filter(m => 
        chapter.memory_ids && chapter.memory_ids.includes(m.id)
      )
      
      const pageContent = []
      
      // Cabecera
      pageContent.push(
        h(View, { key: 'header', style: styles.chapterOpener },
          h(Text, { style: styles.chapterNumber }, `Capítulo ${chapterNum}`),
          h(Text, { style: styles.chapterTitle }, chapter.title),
          chapter.subtitle ? h(Text, { style: styles.chapterSubtitle }, chapter.subtitle) : null,
          h(Text, { style: styles.chapterOrnament }, '◆')
        )
      )
      
      // Apertura
      if (chapter.generated_opening) {
        pageContent.push(
          h(Text, { key: 'opening', style: styles.chapterOpening }, chapter.generated_opening)
        )
      }
      
      // Memorias
      chapterMemories.forEach((memory, i) => {
        const memoryText = getMemoryText(memory)
        const paragraphs = memoryText.split(/\n\n+/).filter(p => p.trim())
        
        const memoryContent = [
          h(Text, { key: 'attr', style: styles.memoryAttribution }, 
            `— ${memory.contributor_name}, ${memory.contributor_relationship || 'familiar'}`
          )
        ]
        
        // Foto
        if (memory.signedPhotoUrl) {
          memoryContent.push(
            h(Image, { key: 'photo', style: styles.memoryPhoto, src: memory.signedPhotoUrl })
          )
        }
        
        // Párrafos
        paragraphs.forEach((para, j) => {
          memoryContent.push(
            h(Text, { 
              key: `para-${j}`, 
              style: j === 0 ? styles.memoryTextFirst : styles.memoryText 
            }, para.trim())
          )
        })
        
        pageContent.push(
          h(View, { key: `memory-${memory.id}`, style: styles.memoryBlock, wrap: false }, 
            memoryContent
          )
        )
        
        // Transición
        if (i < chapterMemories.length - 1 && chapter.generated_transitions) {
          const nextMemory = chapterMemories[i + 1]
          const transitionKey = `${memory.id}_to_${nextMemory.id}`
          const transition = chapter.generated_transitions[transitionKey]
          if (transition) {
            pageContent.push(
              h(Text, { key: `trans-${i}`, style: styles.transition }, transition)
            )
          }
        }
      })
      
      // Cierre
      if (chapter.generated_closing) {
        pageContent.push(
          h(View, { key: 'closing' },
            h(Text, { style: styles.chapterClosing }, chapter.generated_closing),
            h(Text, { style: styles.chapterClosingOrnament }, '◆')
          )
        )
      }
      
      pages.push(
        h(Page, { key: `chapter-${chapterIndex}`, size: 'A4', style: styles.page, wrap: true },
          pageContent
        )
      )
      return
    }
    
    if (chapter.chapter_type === 'epilogue') {
      pages.push(
        h(Page, { key: `epilogue-${chapterIndex}`, size: 'A4', style: styles.page },
          h(Text, { style: styles.sectionTitle }, 'Epílogo'),
          h(View, { style: styles.sectionLine }),
          h(Text, { style: styles.prologueText }, chapter.generated_opening || '')
        )
      )
    }
  })
  
  // COLOFÓN
  pages.push(
    h(Page, { key: 'colophon', size: 'A4', style: styles.page },
      h(View, { style: styles.colophonPage },
        h(Text, { style: styles.colophonOrnament }, '❦'),
        h(Text, { style: styles.colophonText }, 'Este libro fue compuesto con las memorias'),
        h(Text, { style: styles.colophonText }, `compartidas por quienes más quieren a ${book.honoree_name}.`),
        h(Text, { style: styles.colophonText }, ' '),
        h(Text, { style: styles.colophonText }, `Terminado de editar el ${date}.`),
        h(Text, { style: styles.colophonText }, ' '),
        h(Text, { style: styles.colophonText }, 'Que estas palabras perduren'),
        h(Text, { style: styles.colophonText }, 'como perdura el amor que las inspiró.'),
        h(View, { style: styles.colophonBrand },
          h(Text, { style: { ...styles.colophonText, marginBottom: 8 } }, '✦'),
          h(Text, { style: styles.colophonText }, 'Libro de Memorias'),
          h(Text, { style: { ...styles.colophonText, fontSize: 8 } }, 'librodememorias.com')
        )
      )
    )
  )
  
  return h(Document, null, pages)
}

export default createBookDocument
