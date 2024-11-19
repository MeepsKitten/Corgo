import { defineStore } from 'pinia'
import squaresData from '@/data/squares.json'
import { useBingoStore } from '@/bingoStore'

const MODE_NAMES = {
  daily: 'Daily Board',
  versus: 'Versus Board',
  random: 'Random Board'
} as const


// Define a type for the keys of squaresData
type Difficulty = keyof typeof squaresData;

// Create a separate debug store
export const useDebugFunctions = defineStore('debug', () => {
  const store = useBingoStore()
  const board = useBingoBoard()

  // Function to get or generate a constant user-specific seed
  function getUserSeed(): string {
    let userSeed = localStorage.getItem('constantUserSeed')
    if (!userSeed) {
      userSeed = generateConstantSeed()
      localStorage.setItem('constantUserSeed', userSeed)
      console.log(`Generated new constant user seed: ${userSeed}`)
    } else {
      console.log(`Using existing constant user seed: ${userSeed}`)
    }
    return userSeed
  }

  // Add reset function
  function resetUserSeed() {
    localStorage.removeItem('constantUserSeed')
    const newSeed = generateConstantSeed()
    localStorage.setItem('constantUserSeed', newSeed)
    console.log(`Reset user seed. New seed: ${newSeed}`)
    
    // Regenerate the board if we're on the versus page
    if (window.location.pathname.includes('versus')) {
      board.handleBoardGeneration(window.location.pathname)
    }
  }

  // Function to generate a constant seed based on user-specific data
  function generateConstantSeed(): string {
    // Collect various browser/device characteristics
    const userAgent = navigator.userAgent
    const language = navigator.language
    const platform = navigator.platform
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const colorDepth = window.screen.colorDepth
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Combine all the characteristics into a single string
    const combinedData = `${userAgent}-${language}-${platform}-${screenResolution}-${colorDepth}-${timezone}`
    
    // Create a simple hash of the combined data
    let hash = 0
    for (let i = 0; i < combinedData.length; i++) {
      const char = combinedData.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Convert the hash to a positive base-36 string
    const positiveHash = Math.abs(hash)
    const seed = positiveHash.toString(36)
    
    console.log('Generated seed from user data:', seed)
    return seed
  }

  function debugSetTime(hoursFromNow: number) {
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + hoursFromNow)
    const newDateISO = currentDate.toISOString()
    
    store.$patch({
      boardDates: {
        ...store.boardDates,
        daily: newDateISO,
        versus: newDateISO
      }
    })
    
    console.log(`Global date set to: ${currentDate.toLocaleString()}`)
    
    board.handleBoardGeneration(window.location.pathname)
    
    console.log('Board refreshed with new date')
  }

  return {
    debugSetTime,
    getUserSeed,
    resetUserSeed
  }
})

if (typeof window !== 'undefined') {
  window.resetBingoData = () => {
    const store = useBingoStore()
    store.$reset()
    localStorage.removeItem('bingo')
    console.log('Bingo data has been reset. Please refresh the page.')
  }

  window.debugSetTime = (hoursFromNow: number) => {
    const debug = useDebugFunctions()
    debug.debugSetTime(hoursFromNow)
  }

  window.resetUserSeed = () => {
    const debug = useDebugFunctions()
    debug.resetUserSeed()
  }
}

declare global {
  interface Window {
    resetBingoData: () => void
    debugSetTime: (hoursFromNow: number) => void
    resetUserSeed: () => void
  }
}

export function useBingoBoard() {
  const store = useBingoStore()
  const debug = useDebugFunctions()
  const bingoItems = ref(Array(25).fill({ text: '', selected: false }))
  const winningCells = ref<number[]>([])
  const currentMode = ref('Daily Board')
  const countdownTime = ref('')
  const showCountdown = ref(false)
  const isLoading = ref(false)

  watchEffect(() => {
    const currentModeKey = currentMode.value.toLowerCase().replace(' board', '') as 'daily' | 'versus' | 'random'
    const selections = store[currentModeKey]
    
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

    const winningLines = lines.filter(line => 
      line.every(cellIndex => selections.includes(cellIndex))
    )

    winningCells.value = [...new Set(winningLines.flat())]
  })

  const toggleCell = (index: number) => {
    const store = useBingoStore()
    const currentModeKey = currentMode.value.toLowerCase().replace(' board', '') as 'daily' | 'versus' | 'random'
    store.toggleSelection(currentModeKey, index)
  }

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }

  const getRandomItem = (difficulty: Difficulty, usedItems: Set<string>, randomFunc = Math.random) => {
    const items = squaresData[difficulty];
    const availableItems = Array.isArray(items) ? items.filter(item => !usedItems.has(item)) : [];

    if (availableItems.length > 0) {
      return availableItems[Math.floor(randomFunc() * availableItems.length)]
    }

    const difficultyOrder = ['Rare', 'Hard', 'Medium', 'Easy']
    const currentIndex = difficultyOrder.indexOf(difficulty)

    for (let i = currentIndex + 1; i < difficultyOrder.length; i++) {
      const easierDifficulty = difficultyOrder[i] as Difficulty
      const items = squaresData[easierDifficulty]
      const easierItems = Array.isArray(items) ? items.filter(item => !usedItems.has(item)) : []
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
    const usedItems = new Set<string>()

    winningCells.value = []

    difficulties.forEach(difficulty => {
      const item = getRandomItem(difficulty as Difficulty, usedItems, randomFunc)
      usedItems.add(item)
      items.push({ text: item, selected: false })
    })

    while (items.length < 24) {
      const rand = randomFunc()
      const randomDifficulty =
        rand < 0.3 ? 'Easy' :
        rand < 0.53 ? 'Medium' :
        rand < 0.76 ? 'Hard' : 'Rare'

      const item = getRandomItem(randomDifficulty as Difficulty, usedItems, randomFunc)
      usedItems.add(item)
      items.push({ text: item, selected: false })
    }

    const freeItem = getRandomItem('Free', new Set(), randomFunc)
    const currentModeKey = currentMode.value.toLowerCase().replace(' board', '') as 'daily' | 'versus' | 'random'
    store.setSelection(currentModeKey, 12, true) // Assuming index 12 is the free space

    return { items, freeItem }
  }

  const updateCountdown = () => {
    const now = new Date()
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const tomorrow = new Date(est)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const diff = tomorrow.getTime() - est.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    countdownTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const startCountdownTimer = () => {
    updateCountdown()
    setInterval(updateCountdown, 1000)
  }

  const generateDailyBoard = () => {
    currentMode.value = MODE_NAMES.daily
    showCountdown.value = true

    // Use the global date from store instead of current date
    const globalDate = new Date(store.boardDates.versus)
    const dateSeed = globalDate.getFullYear() * 10000 + (globalDate.getMonth() + 1) * 100 + globalDate.getDate()
    let seedNum = dateSeed

    const { items, freeItem } = generateBoard(() => seededRandom(seedNum++))

    bingoItems.value = [
      ...items.slice(0, 12),
      { text: freeItem, selected: true, free: true },
      ...items.slice(12)
    ]
  }

  const generateVersusBoard = (userSeed?: string) => {
    currentMode.value = MODE_NAMES.versus
    showCountdown.value = true

    // Use the global date from store instead of current date
    const globalDate = new Date(store.boardDates.versus)
    const dateSeed = globalDate.getFullYear() * 10000 + (globalDate.getMonth() + 1) * 100 + globalDate.getDate()
    let seedNum = dateSeed

    // Generate the board items based on the date seed
    const { items, freeItem } = generateBoard(() => seededRandom(seedNum++))  

    // Modified shuffling logic with better seed handling
    const userSpecificSeed = userSeed || debug.getUserSeed()
    let userSeedNum = parseInt(userSpecificSeed.replace(/[^0-9a-f]/gi, ''), 16) % 1000000
    
    const shuffledItems = [...items]
    for (let i = shuffledItems.length - 1; i > 0; i--) {
        // Use multiple rounds of seededRandom to increase randomness
        const seed1 = seededRandom(userSeedNum + i)
        const seed2 = seededRandom(userSeedNum + i + 1000)
        const finalSeed = (seed1 + seed2) / 2
        const j = Math.floor(finalSeed * (i + 1))
        ;[shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]]
    }

    console.log('User seed used:', userSpecificSeed)
    console.log('Initial userSeedNum:', userSeedNum)

    bingoItems.value = [
        ...shuffledItems.slice(0, 12),
        { text: freeItem, selected: true, free: true },
        ...shuffledItems.slice(12)
    ]
  }

  const generateRandomBoard = (seed?: string) => {
    currentMode.value = MODE_NAMES.random
    showCountdown.value = false
    
    if (!seed) {
      console.error('No seed provided for random board generation')
      return
    }

    let seedNum = parseInt(seed, 36)
    const randomFunc = () => seededRandom(seedNum++)
    
    const { items, freeItem } = generateBoard(randomFunc)
    const shuffledItems = [...items].sort(() => randomFunc())

    bingoItems.value = [
      ...shuffledItems.slice(0, 12),
      { text: freeItem, selected: true, free: true },
      ...shuffledItems.slice(12)
    ]
  }

    // Add this to refreshRandom function
    const refreshRandom = () => {
        // Clear existing selections for random mode
        store.random = [];
        store.clearRandomSeed();
    
        // Generate a new random board
        const newSeed = Math.random().toString(36).substring(2, 15);
        const randomDate = new Date();
        store.$patch({ 
          randomSeed: newSeed,
          boardDates: {
            ...store.boardDates,
            random: randomDate.toISOString()
          }
        });
    
        generateRandomBoard(newSeed);
      };

  // Add a helper function to check if dates match

  const handleBoardGeneration = (path: string) => {
    if (path.includes('daily')) {
      generateDailyBoard()
    } else if (path.includes('versus')) {
      generateVersusBoard()
    } else if (path.includes('random')) {
      generateRandomBoard(store.randomSeed)
    }
  }

  return {
    bingoItems,
    winningCells,
    currentMode,
    countdownTime,
    showCountdown,
    toggleCell,
    generateDailyBoard,
    generateVersusBoard,
    generateRandomBoard,
    startCountdownTimer,
    isLoading,
    refreshRandom,
    handleBoardGeneration
  }
}