<template>
  <v-container fluid class="bingo-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" class="d-flex justify-center">
        <div class="bingo-wrapper">
          <div class="bingo-title text-center text-h4 py-4">
            CORGO
          </div>
          <div class="bingo-board">
            <div class="bingo-grid">
              <v-card v-for="(cell, index) in bingoItems" :key="index" class="bingo-cell" :class="{ 'selected': cell.selected, 'free-space': cell.isFree && !cell.selected }" elevation="2" @click="toggleCell(index)">
                <v-card-text class="text-center d-flex align-center justify-center">
                  <span>{{ cell.text }}</span>
                </v-card-text> 
              </v-card>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import squaresData from '@/data/squares.json'

const bingoItems = ref([])

const toggleCell = (index) => {
  bingoItems.value[index].selected = !bingoItems.value[index].selected
}

const getRandomItem = (array, usedItems) => {
  let item;
  do {
    item = array[Math.floor(Math.random() * array.length)];
  } while (usedItems.has(item));
  usedItems.add(item);
  return item;
}

const generateBingoBoard = () => {
  const difficulties = ['Easy', 'Medium', 'Hard', 'Rare']
  const items = []
  const usedItems = new Set()

  // Ensure at least one item from each difficulty
  difficulties.forEach(difficulty => {
    items.push({ text: getRandomItem(squaresData[difficulty], usedItems), selected: false })
  })

  // Fill remaining slots with weighted randomness
  while (items.length < 24) {
    const randomDifficulty = Math.random() < 0.6 ? 'Easy' : Math.random() < 0.85 ? 'Medium' : Math.random() < 0.95 ? 'Hard' : 'Rare'
    items.push({ text: getRandomItem(squaresData[randomDifficulty], usedItems), selected: false })
  }

  // Shuffle the items
  items.sort(() => Math.random() - 0.5)

  // Insert the free item in the center
  bingoItems.value = [
    ...items.slice(0, 12),
    { text: getRandomItem(squaresData['Free'], usedItems), selected: false, isFree: true },
    ...items.slice(12)
  ]
}

onMounted(() => {
  generateBingoBoard()
})
</script>

<style scoped>
.bingo-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-image:
    radial-gradient(circle at center, #ffffff, transparent 30%),
    conic-gradient(from 0deg, #ff78ab 5%, #3becff 25%, #3becff 35%, #fcff76 55%, #fcff76 65%, #ff78ab 95%);
}

.bingo-wrapper {
  width: 90vmin;
  height: 90vmin;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.bingo-board {
  background: linear-gradient(135deg, #3becff 0%, #3becff 100%);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1vmin;
  box-sizing: border-box;
}

.bingo-title {
  font-family: 'Baloo 2', cursive, sans-serif;
  font-size: 3vmin;
  margin-bottom: 2vmin;
}

.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 1vmin;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.bingo-cell {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  transition: transform 0.3s ease;
  background-color: white;
}

.bingo-cell:hover {
  transform: scale(0.95);
}

.bingo-cell .v-card-text {
  font-weight: bold;
  text-align: center;
  color: #ff78ab;
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
</style>
