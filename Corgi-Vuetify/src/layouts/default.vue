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
              <v-card v-for="(cell, index) in bingoItems" 
                      :key="index" 
                      class="bingo-cell"
                      :class="{ 'selected': cell.selected }"
                      elevation="2"
                      @click="toggleCell(index)"
              >
                <v-card-text class="text-center d-flex align-center justify-center">
                  {{ cell.text }}
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
import { ref } from 'vue'

const bingoItems = ref(Array(25).fill(null).map((_, index) => ({
  text: `Item ${index + 1}`,
  selected: false
})))

const toggleCell = (index) => {
  bingoItems.value[index].selected = !bingoItems.value[index].selected
}
</script>

<style scoped>
.bingo-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1vmin;
  box-sizing: border-box;
}

.bingo-title {
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
}

.bingo-cell:hover {
  transform: scale(0.95);
}

.bingo-cell .v-card-text {
  font-weight: bold;
}

.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
</style>
