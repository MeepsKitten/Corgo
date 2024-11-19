<template>
  <v-container class="bingo-container" fluid>
    <div class="bingo-wrapper">
      <div class="bingo-title text-center">
        <div /><!-- Blank space on left -->
        <h1 class="mode-title">{{ currentMode }}</h1>
        <div v-if="showCountdown" class="countdown-text">
          Next board in: {{ countdownTime }}
        </div>
      </div>
      <div class="portrait-spacer" />
      <div class="bingo-grid">
        <v-card
          v-for="(cell, index) in bingoItems"
          :key="index"
          class="bingo-cell"
          :class="{
            'selected': cell.selected,
            'free-space': cell.isFree && !cell.selected,
            'winning-cell': winningCells.includes(index)
          }"
          elevation="2"
          @click="toggleCell(index)"
        >
          <v-card-text
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
    <v-bottom-navigation>
      <v-btn class="board-btn" @click="generateDailyBoard">
        <v-icon>mdi-calendar</v-icon>
        Daily
      </v-btn>
      <v-btn class="board-btn" @click="generateVersusBoard">
        <v-icon>mdi-sword-cross</v-icon>
        Versus
      </v-btn>
      <v-btn class="board-btn" @click="generateRandomBoard">
        <v-icon>mdi-dice-3</v-icon>
        Random
      </v-btn>
    </v-bottom-navigation>
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
  height: 100%;
  background-image:
    radial-gradient(circle at center, #ffffff, transparent 30%),
    conic-gradient(from 0deg, #ff78ab 5%, #3becff 25%, #3becff 35%, #fcff76 55%, #fcff76 65%, #ff78ab 95%);
}

.bingo-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: auto;
}

.bingo-title {
  padding: 1.5em;
}

.mode-title {
  font-size: 2em;
  color: #3becff;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
}

.countdown-text {
  font-size: 1em;
  color: #3becff;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
}

.portrait-spacer {
  height: calc((100vh - 100vw) * 0.3 - 48px);
}

.bingo-grid {
  margin: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: min(1.5vh, 8px);
  min-width: 300px;
  max-width: min(100vw, calc(100vh - 15em));
  aspect-ratio: 1;
}

.bingo-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  transition: all 0.5s ease;
  color: #ff78ab;
  line-height: 1.2em;
  overflow: hidden;
  text-align: center;
  padding: 8px;
}

.bingo-cell:hover {
  transform: scale(0.95);
}

.bingo-cell .v-card-text {
  font-weight: 500;
  font-size: min(2.5vmin, 16px);
  overflow-wrap: break-word;
  text-wrap: balance;
  text-align: center;
  hyphens: auto;
  padding: 0;
}

@media (max-width: 600px), (max-height: 800px) {
  .bingo-cell {
    padding: 2px;
  }

  .bingo-cell .v-card-text {
    padding: 4px;
    font-size: 2vmin;
    line-height: 1em;
  }
}

@media (max-width: 400px), (max-height: 600px) {
  .bingo-cell .v-card-text {
    padding: 1px;
    font-size: 10px;
  }
}

.bingo-cell.selected {
  background: linear-gradient(135deg, #ff78ab 0%, #fcff76 100%);
  color: white;
  text-shadow: 1px 1px 2px #000a;
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

@media (max-width: 600px) {
  .button-container {
    flex-direction: column;
    bottom: 10px;
    gap: 0.5rem;
  }
}

@media (max-height: 600px) {
  .bingo-container {
    padding: 0.5rem;
  }
}
</style>
