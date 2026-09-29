import { db } from './firebase'
import { model } from './ai'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { RoadmapNode } from '@/types'

function getTodayId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getDailyAdvice(
  node: RoadmapNode | null,
  streak: number,
  todayCompleted: boolean
): Promise<string> {
  const todayId = getTodayId()
  const docRef = doc(db, 'daily_advice', todayId)
  
  try {
    const snapshot = await getDoc(docRef)
    const data = snapshot.exists() ? snapshot.data() : {}
    
    const fieldKey = !node
      ? (todayCompleted ? 'welcome_completed' : (streak > 0 ? 'welcome_streak' : 'welcome_new'))
      : `section_${node.id}`
      
    if (data[fieldKey]) {
      return data[fieldKey]
    }
    
    let prompt = ''
    if (!node) {
      if (todayCompleted) {
        prompt = 'O usuário já concluiu a prática de canto de hoje. Dê uma mensagem curta de parabéns e encorajamento (no máximo 2 frases) começando com um tom de "Conselho do amigo".'
      } else if (streak > 0) {
        prompt = `O usuário tem uma ofensiva de ${streak} dias de prática de canto, mas ainda não praticou hoje. Dê uma mensagem curta de encorajamento para ele não perder a ofensiva (no máximo 2 frases) começando com um tom de "Conselho do amigo".`
      } else {
        prompt = 'O usuário ainda não tem ofensiva de prática de canto (está começando ou recomeçando). Dê uma mensagem de boas-vindas e incentivo para ele começar a prática de hoje (no máximo 2 frases) começando com um tom de "Conselho do amigo".'
      }
    } else {
      const exNames = node.exercises.map(e => e.name).join(', ')
      const exWithVideo = node.exercises.find(e => e.videos && e.videos.length > 0)
      
      prompt = `O usuário está entrando na seção "${node.title}". Exercícios: ${exNames}. Dê um conselho curto (máx 2 frases) de como aproveitar bem. `
      if (exWithVideo) {
        prompt += `Recomende fortemente prestar atenção no vídeo do exercício "${exWithVideo.name}". `
      }
      prompt += 'Comece com um tom de "Conselho do amigo".'
    }
    
    const result = await model.generateContent(prompt)
    const advice = result.response.text().trim()
    
    await setDoc(docRef, { [fieldKey]: advice }, { merge: true })
    
    return advice
  } catch (err) {
    console.error('Error fetching/generating daily advice:', err)
    return "Aqueça a voz, beba água e vamos começar a prática!"
  }
}
