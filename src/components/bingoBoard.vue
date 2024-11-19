<template>
    <v-container class="bingo-container" fluid :key="route.path">
      <div class="bingo-wrapper">
        <div class="bingo-title text-center">
          <div /><!-- Blank space on left -->
          <h1 class="mode-title">{{ currentMode }}</h1>
          <div class="board-date">{{ formattedDate }}</div>
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
              'selected': isSelected(index),
              'free-space': cell.free && !isSelected(index),
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
        <v-btn class="board-btn" :to="'/daily'">
          <v-icon>mdi-calendar</v-icon>
          Daily
        </v-btn>
        <v-btn class="board-btn" :to="'/versus'">
          <v-icon>mdi-sword-cross</v-icon>
          Versus
        </v-btn>
        <v-btn 
          class="board-btn" 
          @click="refreshRandom" 
          v-if="route.path === '/random'"
        >
          <v-icon>mdi-dice-3</v-icon>
          New Random
        </v-btn>
        <v-btn 
          class="board-btn" 
          :to="'/random'" 
          v-else
        >
          <v-icon>mdi-dice-3</v-icon>
          Random
        </v-btn>
        <v-btn class="board-btn" @click="openDatePicker" :class="{ 'flash-yellow': !isToday }">
          <v-icon>mdi-calendar-search</v-icon>
          History
        </v-btn>
      </v-bottom-navigation>
      <v-dialog 
        v-model="showDatePicker" 
        max-width="400px"
        class="date-picker-dialog"
      >
        <v-card theme="dark" class="date-picker-card">
          <v-card-title class="text-center pb-2">Select Date</v-card-title>
          <v-card-text>
            <v-date-picker 
              v-model="selectedDate"
              width="100%"
              elevation="0"
              color="#ff78ab"
              header-color="#3becff"
              theme="dark"
              :max="maxDate"
              :min="minDate"
            ></v-date-picker>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn 
              color="#ff78ab"
              @click="resetDate"
            >
              Reset
            </v-btn>
            <v-btn 
              color="#ff78ab"
              @click="confirmDate"
            >
              Confirm
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <Transition name="fade">
        <div v-if="isLoading" class="loading-overlay">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
        </div>
      </Transition>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { onMounted, watch, computed, ref } from 'vue'
  import { useBingoBoard } from '@/composables/bingoBoard'
  import { useRoute} from 'vue-router'
  import { useBingoStore } from '../bingoStore'
  import squaresData from '@/data/squares.json' // Import the JSON file
  import { useDebugFunctions } from '@/composables/bingoBoard'

  const route = useRoute()
  const store = useBingoStore()
  const debug = useDebugFunctions()
  
  const board = useBingoBoard()
  
  const {
    bingoItems,
    winningCells,
    currentMode,
    countdownTime,
    showCountdown,
    startCountdownTimer,
    generateDailyBoard,
    generateRandomBoard,
    isLoading,
    refreshRandom,
  } = board
  
  // Define the possible modes
type BingoMode = 'daily' | 'versus' | 'random';

// Ensure currentBoardMode is of type BingoMode
const currentBoardMode = computed<BingoMode>(() => {
  const path = route.path.replace('/', '') as BingoMode;
  return path || 'daily';
});

  // Replace toggleCell with store version
  const toggleCell = (index: number) => {
    store.toggleSelection(currentBoardMode.value, index)
  }
  
  // Update your template to check selections from store
  const isSelected = (index: number) => {
    return store[currentBoardMode.value].includes(index)
  }
  const selectedDate = ref(new Date())

  const isToday = computed(() => {
    const today = new Date();
    const selected = new Date(selectedDate.value);
    return today.toDateString() === selected.toDateString();
  });

  const confirmDate = () => {
    showDatePicker.value = false;
    const newDate = selectedDate.value;
    const isoString = newDate.toISOString();
    
    // Update store dates
    store.$patch({
      boardDates: {
        daily: isoString,
        versus: isoString,
        random: isoString
      }
    });

    // Clear existing selections
    store.daily = [];
    store.versus = [];
    store.random = [];
    store.clearRandomSeed();
    store.clearVersusSeed();

    // Regenerate the board with the new date
    console.log('Regenerating board for path:', route.path);
    board.handleBoardGeneration(route.path);
    
    console.log('Date selected:', newDate.toLocaleDateString());
    console.log('Store dates:', store.boardDates);

    // Reset the button state
    //selectedDate.value = new Date();
  };

  const resetDate = () => {
    const now = new Date();
    const estOffset = -5 * 60; // EST is UTC-5
    const estDate = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000);
    selectedDate.value = estDate;
  };

  // Calculate the current date in EST
const maxDate = computed(() => {
  const now = new Date()
  const estOffset = -5 * 60 // EST is UTC-5
  const estDate = new Date(now.getTime() + (now.getTimezoneOffset() + estOffset) * 60000)
  return estDate.toISOString().substr(0, 10) // Format as YYYY-MM-DD
})
  
const checkVersusSeed = () => {
  if (!store.versusSeed) return false

  const storedDate = new Date(store.versusSeed.date)
  const globalDate = new Date(store.boardDates.daily) // Use global date instead of current date
  
  const storedEst = new Date(storedDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const globalEst = new Date(globalDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  return storedEst.getFullYear() === globalEst.getFullYear() &&
         storedEst.getMonth() === globalEst.getMonth() &&
         storedEst.getDate() === globalEst.getDate()
}
  
  const generateBoardVersus = () => {
    const userSeed = localStorage.getItem('versusSeed') || debug.getUserSeed()
    board.generateVersusBoard(userSeed)
  }
  
  const generateBoard = (path: string) => {
    switch (path) {
      case '/daily':
        // Only update daily date if it doesn't exist
        if (!store.boardDates.daily) {
          store.$patch({
            boardDates: {
              ...store.boardDates,
              daily: new Date().toISOString()
            }
          })
        }
        generateDailyBoard()
        break
      case '/versus':
        generateBoardVersus()
        break
      case '/random':
        // Only generate new random if no seed exists
        if (!store.randomSeed) {
          const newSeed = Math.random().toString(36).substring(2, 15)
          const randomDate = new Date()
          store.$patch({ 
            randomSeed: newSeed,
            boardDates: {
              ...store.boardDates,
              random: randomDate.toISOString()
            }
          })
        }
        generateRandomBoard(store.randomSeed)
        break
      default:
        generateDailyBoard()
    }
  }
  
  // Add this to clear the versus seed at midnight EST
  const startVersusSeedCheck = () => {
    const checkAndResetVersus = () => {
      if (store.versusSeed && !checkVersusSeed()) {
        store.clearVersusSeed()
        if (route.path === '/versus') {
          generateBoard('/versus')
        }
      }
    }

    // Check every minute
    setInterval(checkAndResetVersus, 60000)
  }
  
  // Watch for route changes
  watch(
    () => route.path,
    (newPath) => {
      generateBoard(newPath)
    },
    { immediate: true }
  )
  
  onMounted(() => {
    startCountdownTimer()
    startVersusSeedCheck()
  })
  
  // Replace the existing formattedDate computed property
  const formattedDate = computed(() => {
    let dateToUse: Date;
    const mode = currentBoardMode.value
    
    if (mode === 'versus' && store.boardDates.versus) {
      dateToUse = new Date(store.boardDates.versus)
    } else if (mode === 'random' && store.boardDates.random) {
      dateToUse = new Date(store.boardDates.random)
    } else {
      dateToUse = new Date(store.boardDates.daily)
    }
    
    const est = new Date(dateToUse.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    return est.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })
  const showDatePicker = ref(false)
  
  const openDatePicker = () => {
    showDatePicker.value = true
  }
  
  watch(
    () => store.boardDates,
    (newDates) => {
      board.handleBoardGeneration(route.path)
    },
    { deep: true }
  )
  
  const minDate = squaresData.dateModified; // Use the dateModified from JSON
  
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
    background: linear-gradient(135deg, #ff78ab 0%, #3becff 100%) !important;
    border: 2px solid #3becff;
    box-shadow: 0 0 20px 5px #3becff;
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
  
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(3px);
  }
  
  /* Fade transition */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .board-date {
    font-size: 1.2em;
    color: #fcff76;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
    margin-top: 0.5em;
  }
  
  .flash-yellow {
    animation: flash-yellow 1s infinite alternate;
  }

  @keyframes flash-yellow {
    0% {
      background-color: yellow;
    }
    100% {
      background-color: transparent;
    }
  }
  </style>
  