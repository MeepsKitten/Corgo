<template>
  <v-container fluid class="bingo-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" class="d-flex justify-center">
        <div class="bingo-wrapper">
          <div class="bingo-title text-center">
            <h1 class="mode-title">{{ currentMode }}</h1>
            <div v-if="showCountdown" class="countdown-text">
              Next board in: {{ countdownTime }}
            </div>
          </div>
          <div class="bingo-board">
            <div class="bingo-grid">
              <v-card v-for="(cell, index) in bingoItems" :key="index" class="bingo-cell" :class="{ 'selected': cell.selected, 'free-space': cell.isFree && !cell.selected, 'winning-cell': winningCells.includes(index) }" elevation="2" @click="toggleCell(index)">
                <v-card-text 
                  class="text-center d-flex align-center justify-center"
                  :class="{
                    'text-small': cell?.text?.length > 20,
                    'text-smaller': cell?.text?.length > 30
                  }"
                >
                  <span>{{ cell.text }}</span>
                </v-card-text> 
              </v-card>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
    <div class="button-container">
      <v-btn
        class="board-btn"
        color="#ff78ab"
        @click="generateDailyBoard"
        elevation="2"
      >
        Daily Board
      </v-btn>
      <v-btn
        class="board-btn"
        color="#ff78ab"
        @click="generateVersusBoard"
        elevation="2"
      >
        Versus Board
      </v-btn>
      <v-btn
        class="board-btn"
        color="#ff78ab"
        @click="generateRandomBoard"
        elevation="2"
      >
        Random Board
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import squaresData from '@/data/squares.json'

const bingoItems = ref(Array(25).fill().map(() => ({ 
  text: '', 
  selected: false 
})))
const winningCells = ref([])
const currentMode = ref('Daily Board')
const countdownTime = ref('')
const showCountdown = ref(false)

const toggleCell = (index) => {
  bingoItems.value[index].selected = !bingoItems.value[index].selected
  checkWinningLines()
}

const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const getRandomItem = (difficulty, usedItems, randomFunc = Math.random) => {
  const availableItems = squaresData[difficulty].filter(item => !usedItems.has(item))
  
  if (availableItems.length > 0) {
    return availableItems[Math.floor(randomFunc() * availableItems.length)]
  }

  const difficultyOrder = ['Rare', 'Hard', 'Medium', 'Easy']
  const currentIndex = difficultyOrder.indexOf(difficulty)
  
  for (let i = currentIndex + 1; i < difficultyOrder.length; i++) {
    const easierDifficulty = difficultyOrder[i]
    const easierItems = squaresData[easierDifficulty].filter(item => !usedItems.has(item))
    if (easierItems.length > 0) {
      return easierItems[Math.floor(randomFunc() * easierItems.length)]
    }
  }
  
  usedItems.clear()
  return squaresData[difficulty][Math.floor(randomFunc() * squaresData[difficulty].length)]
}

const generateBoard = (randomFunc = Math.random) => {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Rare']
  const items = []
  const usedItems = new Set()

  winningCells.value = []

  difficulties.forEach(difficulty => {
    const item = getRandomItem(difficulty, usedItems, randomFunc)
    usedItems.add(item)
    items.push({ text: item, selected: false })
  })

  while (items.length < 24) {
    const rand = randomFunc()
    const randomDifficulty = 
      rand < 0.3 ? 'Easy' :
      rand < 0.53 ? 'Medium' :
      rand < 0.76 ? 'Hard' : 'Rare'
    
    const item = getRandomItem(randomDifficulty, usedItems, randomFunc)
    usedItems.add(item)
    items.push({ text: item, selected: false })
  }

  const freeItem = getRandomItem('Free', new Set(), randomFunc)
  return { items, freeItem }
}

const updateCountdown = () => {
  const now = new Date()
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const tomorrow = new Date(est)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const diff = tomorrow - est
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  countdownTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const startCountdownTimer = () => {
  updateCountdown()
  setInterval(updateCountdown, 1000)
}

const generateDailyBoard = () => {
  currentMode.value = 'Daily Board'
  showCountdown.value = true
  const today = new Date()
  const est = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  let seed = est.getFullYear() * 10000 + (est.getMonth() + 1) * 100 + est.getDate()
  const { items, freeItem } = generateBoard(() => seededRandom(seed++))
  
  bingoItems.value = [
    ...items.slice(0, 12),
    { text: freeItem, selected: true, isFree: true },
    ...items.slice(12)
  ]
}

const generateVersusBoard = () => {
  currentMode.value = 'Versus Board'
  showCountdown.value = true
  const today = new Date()
  const est = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  let seed = est.getFullYear() * 10000 + (est.getMonth() + 1) * 100 + est.getDate()
  const { items, freeItem } = generateBoard(() => seededRandom(seed++))
  const shuffledItems = [...items].sort(() => Math.random() - 0.5)
  
  bingoItems.value = [
    ...shuffledItems.slice(0, 12),
    { text: freeItem, selected: true, isFree: true },
    ...shuffledItems.slice(12)
  ]
}

const generateRandomBoard = () => {
  currentMode.value = 'Random Board'
  showCountdown.value = false
  const { items, freeItem } = generateBoard()
  items.sort(() => Math.random() - 0.5)
  
  bingoItems.value = [
    ...items.slice(0, 12),
    { text: freeItem, selected: true, isFree: true },
    ...items.slice(12)
  ]
}

const checkWinningLines = () => {
  const lines = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ]

  winningCells.value = []

  lines.forEach(line => {
    if (line.every(index => bingoItems.value[index].selected)) {
      winningCells.value.push(...line)
    }
  })
}

onMounted(() => {
  generateDailyBoard()
  startCountdownTimer()
})
</script>

<style scoped>
.bingo-container {
  min-height: 100dvh;
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 0.1rem;
  box-sizing: border-box;
  background-image:
    radial-gradient(circle at center, #ffffff, transparent 30%),
    conic-gradient(from 0deg, #ff78ab 5%, #3becff 25%, #3becff 35%, #fcff76 55%, #fcff76 65%, #ff78ab 95%);
}

.bingo-wrapper {
  width: min(90vmin, 90%);
  height: min(95vh, 95vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  margin: auto;
}

.bingo-title {
  margin-bottom: 1rem;
  text-align: center;
}

.mode-title {
  font-family: 'Baloo 2', cursive, sans-serif;
  font-size: min(4vmin, 32px);
  color: #3becff;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.countdown-text {
  font-family: 'Baloo 2', cursive, sans-serif;
  font-size: min(2.5vmin, 20px);
  color: #3becff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.bingo-board {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 1vmin;
  box-sizing: border-box;
}

.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: min(1.5vh, 12px);
  width: min(100%, 80vh);
  aspect-ratio: 1;
  box-sizing: border-box;
}

.bingo-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  transition: all 0.5s ease;
  background-color: white;
  border: 2px solid transparent;
  box-shadow: none;
  position: relative;
  overflow: hidden;
}

.bingo-cell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #3becff;
  opacity: 0;
  transition: opacity 0.5s ease;
  z-index: 0;
}

.bingo-cell:hover {
  transform: scale(0.95);
}

.bingo-cell .v-card-text {
  font-weight: bold;
  text-align: center;
  color: #ff78ab;
  position: relative;
  z-index: 1;
  font-size: min(2.5vmin, 16px);
  line-height: 1.2;
  padding: min(1vh, 8px);
  word-wrap: break-word;
  hyphens: auto;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .bingo-cell .v-card-text {
    padding: 3px;
    font-size: min(2vmin, 14px);
  }
}

@media (max-width: 400px) {
  .bingo-cell .v-card-text {
    font-size: min(1.8vmin, 12px);
  }
}

.selected {
  background: linear-gradient(135deg, #ff78ab 0%, #fcff76 100%);
  color: white;
}

.free-space {
  border: 2px solid #ff78ab;
  box-shadow: 0 0 15px 10px #9c4a6a;
  color: #ff78ab;
}

.winning-cell {
  border: 2px solid #ff78ab;
  box-shadow: 0 0 20px 5px #ff78ab;
  animation: winning-glow 2s infinite alternate;
}

.winning-cell::before {
  opacity: 1;
}

@keyframes winning-glow {
  0% {
    box-shadow: 0 0 20px 5px #ff78ab;
    transform: scale(0.95);
  }
  100% {
    box-shadow: 0 0 30px 10px #ff78ab;
    transform: scale(0.90);
  }
}

.button-container {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 10;
}

.board-btn {
  font-family: 'Baloo 2', cursive, sans-serif;
  color: white;
  font-size: min(2vmin, 16px);
  height: min(5vh, 40px);
  padding: 0 min(2vmin, 16px);
  background: #3becff;
  border-radius: 12px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .button-container {
    flex-direction: column;
    bottom: 10px;
    gap: 0.5rem;
  }
  
  .board-btn {
    font-size: 1.5vmin;
    padding: 1.5vmin 3vmin;
  }
}

@media (max-height: 600px) {
  .bingo-container {
    padding: 0.5rem;
  }
}
</style>
