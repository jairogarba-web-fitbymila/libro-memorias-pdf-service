import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'

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
  border: '#E8DFD0',
}

// Estilos base
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.cream,
    paddingTop: 72, // 1 inch
    paddingBottom: 72,
    paddingLeft: 54, // 0.75 inch
    paddingRight: 54,
    fontFamily: 'Crimson',
    fontSize: 11,
    lineHeight: 1.7,
    color: colors.darkText,
  },
  
  // === PORTADA ===
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
  
  // === DEDICATORIA ===
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
  
  // === COPYRIGHT ===
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
  
  // === CAPÍTULOS ===
  chapterOpener: {
    paddingTop: 100,
    marginBottom: 40,
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
  
  // === MEMORIAS ===
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
    height: 'auto',
    marginVertical: 16,
    alignSelf: 'center',
    borderRadius: 4,
  },
  
  // === TRANSICIONES ===
  transition: {
    fontStyle: 'italic',
    fontSize: 10,
    color: colors.softText,
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 40,
  },
  
  // === CIERRE CAPÍTULO ===
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
  
  // === SECCIONES ESPECIALES ===
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
  
  // === COLOFÓN ===
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
    fontSize: 9,
    fontStyle: 'italic',
    color: colors.lightText,
    textAlign: 'center',
  },
})

// Componente del libro
const BookDocument = ({ book, config, chapters, memories }) => {
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
  
  return (
    <Document>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.coverOrnament}>✦ ✦ ✦</Text>
          <Text style={styles.coverTitle}>{book.honoree_name}</Text>
          <View style={styles.coverLine} />
          <Text style={styles.coverSubtitle}>Un libro de memorias</Text>
          <Text style={styles.coverRelationship}>
            {book.honoree_relationship || 'Escrito con amor por su familia'}
          </Text>
        </View>
      </Page>
      
      {/* PÁGINA EN BLANCO */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1 }} />
      </Page>
      
      {/* COPYRIGHT */}
      <Page size="A4" style={styles.page}>
        <View style={styles.copyrightPage}>
          <Text style={styles.copyrightText}>✦</Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={styles.copyrightText}>© {year} Familia de {book.honoree_name}</Text>
          <Text style={styles.copyrightText}>Todos los derechos reservados.</Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={styles.copyrightText}>Este libro de memorias ha sido creado con amor,</Text>
          <Text style={styles.copyrightText}>recogiendo las voces de quienes más le quieren.</Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={styles.copyrightText}> </Text>
          <Text style={{...styles.copyrightText, fontStyle: 'italic'}}>Creado con Libro de Memorias</Text>
          <Text style={{...styles.copyrightText, fontSize: 8}}>librodememorias.com</Text>
        </View>
      </Page>
      
      {/* DEDICATORIA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.dedicationPage}>
          <Text style={styles.dedicationOrnament}>❦</Text>
          <Text style={styles.dedicationText}>
            Para {book.honoree_name},{'\n'}
            cuyas historias merecen ser eternas.
          </Text>
        </View>
      </Page>
      
      {/* PRÓLOGO */}
      {config.include_prologue && (config.prologue_manual_text || config.prologue_generated_text) && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Prólogo</Text>
          <View style={styles.sectionLine} />
          <Text style={styles.prologueText}>
            {config.prologue_type === 'manual' ? config.prologue_manual_text : config.prologue_generated_text}
          </Text>
        </Page>
      )}
      
      {/* CAPÍTULOS */}
      {chapters.map((chapter) => {
        if (chapter.chapter_type === 'intro') {
          if (!chapter.generated_opening) return null
          return (
            <Page key={chapter.id} size="A4" style={styles.page}>
              <Text style={styles.sectionTitle}>Introducción</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.prologueText}>{chapter.generated_opening}</Text>
            </Page>
          )
        }
        
        if (chapter.chapter_type === 'chapter') {
          chapterNum++
          const chapterMemories = memories.filter(m => 
            chapter.memory_ids && chapter.memory_ids.includes(m.id)
          )
          
          return (
            <Page key={chapter.id} size="A4" style={styles.page} wrap>
              {/* Cabecera del capítulo */}
              <View style={styles.chapterOpener}>
                <Text style={styles.chapterNumber}>Capítulo {chapterNum}</Text>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                {chapter.subtitle && (
                  <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
                )}
                <Text style={styles.chapterOrnament}>◆</Text>
              </View>
              
              {/* Apertura */}
              {chapter.generated_opening && (
                <Text style={styles.chapterOpening}>{chapter.generated_opening}</Text>
              )}
              
              {/* Memorias */}
              {chapterMemories.map((memory, i) => {
                const memoryText = getMemoryText(memory)
                const paragraphs = memoryText.split(/\n\n+/).filter(p => p.trim())
                
                return (
                  <View key={memory.id} style={styles.memoryBlock} wrap={false}>
                    <Text style={styles.memoryAttribution}>
                      — {memory.contributor_name}, {memory.contributor_relationship || 'familiar'}
                    </Text>
                    
                    {/* Foto si existe */}
                    {memory.signedPhotoUrl && (
                      <Image style={styles.memoryPhoto} src={memory.signedPhotoUrl} />
                    )}
                    
                    {paragraphs.map((para, j) => (
                      <Text 
                        key={j} 
                        style={j === 0 ? styles.memoryTextFirst : styles.memoryText}
                      >
                        {para.trim()}
                      </Text>
                    ))}
                    
                    {/* Transición */}
                    {i < chapterMemories.length - 1 && chapter.generated_transitions && (
                      (() => {
                        const nextMemory = chapterMemories[i + 1]
                        const transitionKey = `${memory.id}_to_${nextMemory.id}`
                        const transition = chapter.generated_transitions[transitionKey]
                        return transition ? (
                          <Text style={styles.transition}>{transition}</Text>
                        ) : null
                      })()
                    )}
                  </View>
                )
              })}
              
              {/* Cierre */}
              {chapter.generated_closing && (
                <View>
                  <Text style={styles.chapterClosing}>{chapter.generated_closing}</Text>
                  <Text style={styles.chapterClosingOrnament}>◆</Text>
                </View>
              )}
            </Page>
          )
        }
        
        if (chapter.chapter_type === 'epilogue') {
          return (
            <Page key={chapter.id} size="A4" style={styles.page}>
              <Text style={styles.sectionTitle}>Epílogo</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.prologueText}>{chapter.generated_opening || ''}</Text>
            </Page>
          )
        }
        
        return null
      })}
      
      {/* COLOFÓN */}
      <Page size="A4" style={styles.page}>
        <View style={styles.colophonPage}>
          <Text style={styles.colophonOrnament}>❦</Text>
          <Text style={styles.colophonText}>Este libro fue compuesto con las memorias</Text>
          <Text style={styles.colophonText}>compartidas por quienes más quieren a {book.honoree_name}.</Text>
          <Text style={styles.colophonText}> </Text>
          <Text style={styles.colophonText}>Terminado de editar el {date}.</Text>
          <Text style={styles.colophonText}> </Text>
          <Text style={styles.colophonText}>Que estas palabras perduren</Text>
          <Text style={styles.colophonText}>como perdura el amor que las inspiró.</Text>
          <View style={styles.colophonBrand}>
            <Text>✦</Text>
            <Text>Libro de Memorias</Text>
            <Text style={{ fontSize: 8 }}>librodememorias.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default BookDocument
