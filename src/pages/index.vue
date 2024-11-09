<template>
  <v-container fluid class="bingo-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" class="d-flex justify-center">
        <div class="bingo-wrapper">
          <!-- <div class="bingo-title text-center text-h4 py-4">
            CORGO
          </div> -->
          <div class="bingo-board">
            <div class="bingo-grid">
              <v-card v-for="(cell, index) in bingoItems" :key="index" class="bingo-cell" :class="{ 'selected': cell.selected, 'free-space': cell.isFree && !cell.selected, 'winning-cell': winningCells.includes(index) }" elevation="2" @click="toggleCell(index)">
                <v-card-text 
                  class="text-center d-flex align-center justify-center"
                  :class="{
                    'text-small': cell.text.length > 20,
                    'text-smaller': cell.text.length > 30
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
    <v-btn
      class="new-board-btn"
      color="#ff78ab"
      @click="generateBingoBoard"
      elevation="2"
    >
      New Board!
    </v-btn>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import squaresData from '@/data/squares.json'

const bingoItems = ref([])
const winningCells = ref([])

const toggleCell = (index) => {
  bingoItems.value[index].selected = !bingoItems.value[index].selected
  checkWinningLines()
}

const getRandomItem = (difficulty, usedItems) => {
  // Try the requested difficulty first
  const availableItems = squaresData[difficulty].filter(item => !usedItems.has(item))
  
  if (availableItems.length > 0) {
    return availableItems[Math.floor(Math.random() * availableItems.length)]
  }

  // If no items available, try easier difficulties in order
  const difficultyOrder = ['Rare', 'Hard', 'Medium', 'Easy']
  const currentIndex = difficultyOrder.indexOf(difficulty)
  
  // Try each easier difficulty
  for (let i = currentIndex + 1; i < difficultyOrder.length; i++) {
    const easierDifficulty = difficultyOrder[i]
    const easierItems = squaresData[easierDifficulty].filter(item => !usedItems.has(item))
    if (easierItems.length > 0) {
      return easierItems[Math.floor(Math.random() * easierItems.length)]
    }
  }
  
  // If all else fails, clear used items and try original difficulty again
  usedItems.clear()
  return squaresData[difficulty][Math.floor(Math.random() * squaresData[difficulty].length)]
}

const generateBingoBoard = () => {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Rare']
  const items = []
  const usedItems = new Set()

  // Clear winning cells
  winningCells.value = []

  // Ensure at least one item from each difficulty
  difficulties.forEach(difficulty => {
    const item = getRandomItem(difficulty, usedItems)
    usedItems.add(item)
    items.push({ text: item, selected: false })
  })

  // Fill remaining slots with weighted randomness
  while (items.length < 24) {
    const rand = Math.random()
    const randomDifficulty = 
      rand < 0.3 ? 'Easy' :
      rand < 0.53 ? 'Medium' :
      rand < 0.76 ? 'Hard' : 'Rare'
    
    const item = getRandomItem(randomDifficulty, usedItems)
    usedItems.add(item)
    items.push({ text: item, selected: false })
  }

  // Shuffle the items
  items.sort(() => Math.random() - 0.5)

  // Insert the free item in the center
  const freeItem = getRandomItem('Free', new Set())
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
  generateBingoBoard()
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
  font-family: 'Baloo 2', cursive, sans-serif;
  font-size: min(3vmin, 24px);
  height: min(5vh, 40px);
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

.new-board-btn {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Baloo 2', cursive, sans-serif;
  color: white;
  font-size: min(2vmin, 16px);
  height: min(5vh, 40px);
  padding: 0 min(4vmin, 32px);
  background: linear-gradient(135deg, #ff78ab, #fcff76);
  border-radius: 12px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

@media (max-width: 600px) {
  .new-board-btn {
    font-size: 1.5vmin;
    padding: 1.5vmin 3vmin;
  }
}

@media (max-width: 400px) {
  .new-board-btn {
    font-size: 1.2vmin;
    padding: 1vmin 2vmin;
  }
}

@media (max-height: 600px) {
  .bingo-container {
    padding: 0.5rem;
  }
}
</style>
