import { defineStore } from 'pinia'
import squaresData from '@/data/squares.json'
import { useBingoStore } from '@/bingoStore'

const MODE_NAMES = {
  daily: 'Daily Board',
  versus: 'Versus Board',
  random: 'Random Board'
} as const

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
    
    // Force store reinitialization
    const store = useBingoStore()
    store.$patch({
      boardDates: {
        daily: new Date().toISOString(),
        versus: new Date().toISOString(),
        random: new Date().toISOString()
      }
    })
    
    // Regenerate the board if we're on the versus page
    if (window.location.pathname.includes('versus')) {
      board.handleBoardGeneration(window.location.pathname)
    } else {
      // Also regenerate daily board
      board.generateDailyBoard()
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

// Add this helper function at the top of the file, before the composable
function selectRandomItems<T>(array: T[], count: number, randomFunc = Math.random): T[] {
  const result: T[] = [];
  const tempArray = [...array]; // Create a copy to avoid modifying original

  for (let i = 0; i < count && tempArray.length > 0; i++) {
    const randomIndex = Math.floor(randomFunc() * tempArray.length);
    result.push(tempArray[randomIndex]);
    tempArray.splice(randomIndex, 1);
  }

  return result;
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

  const generateBoard = (randomFunc = Math.random) => {
    isLoading.value = true;
    try {
      // Ensure we have a valid date from store
      if (!store.boardDates?.daily) {
        store.$patch({
          boardDates: {
            daily: new Date().toISOString(),
            versus: new Date().toISOString(),
            random: new Date().toISOString()
          }
        });
      }

      // Initialize arrays for different difficulties
      const easySquares = [...squaresData.Easy];
      const mediumSquares = [...squaresData.Medium];
      const hardSquares = [...squaresData.Hard];
      const rareSquares = [...squaresData.Rare];
      
      // Select items based on random function
      const items = [
        ...selectRandomItems(easySquares, 10, randomFunc),
        ...selectRandomItems(mediumSquares, 8, randomFunc),
        ...selectRandomItems(hardSquares, 5, randomFunc),
        ...selectRandomItems(rareSquares, 1, randomFunc)
      ].map(text => ({ text, selected: false })); // Convert strings to objects

      const freeSpace = selectRandomItems(squaresData.Free, 1, randomFunc)[0];
      
      return { items, freeSpace };
    } finally {
      isLoading.value = false;
    }
  };

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
    currentMode.value = MODE_NAMES.daily;
    showCountdown.value = true;

    // Ensure we have a valid date
    if (!store.boardDates?.daily) {
      store.$patch({
        boardDates: {
          daily: new Date().toISOString(),
          versus: new Date().toISOString(),
          random: new Date().toISOString()
        }
      });
    }

    const globalDate = new Date(store.boardDates.daily);
    const dateSeed = globalDate.getFullYear() * 10000 + (globalDate.getMonth() + 1) * 100 + globalDate.getDate();
    let seedNum = dateSeed;

    const { items, freeSpace } = generateBoard(() => seededRandom(seedNum++));

    // Create the board with free space selected
    bingoItems.value = [
      ...items.slice(0, 12),
      { text: freeSpace, selected: true, free: true }, // Free space is selected
      ...items.slice(12)
    ];

    // Also update the store's selection to include the center square (index 12)
    if (!store.daily.includes(12)) {
      store.daily.push(12);
    }
  };

  const generateVersusBoard = (userSeed?: string) => {
    currentMode.value = MODE_NAMES.versus;
    showCountdown.value = true;

    // Use the global date from store instead of current date
    const globalDate = new Date(store.boardDates.versus);
    const dateSeed = globalDate.getFullYear() * 10000 + (globalDate.getMonth() + 1) * 100 + globalDate.getDate();
    let seedNum = dateSeed;

    // Generate the board items based on the date seed
    const { items, freeSpace } = generateBoard(() => seededRandom(seedNum++));

    // Modified shuffling logic with better seed handling
    const userSpecificSeed = userSeed || debug.getUserSeed();
    let userSeedNum = parseInt(userSpecificSeed.replace(/[^0-9a-f]/gi, ''), 16) % 1000000;
    
    const shuffledItems = [...items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
        // Use multiple rounds of seededRandom to increase randomness
        const seed1 = seededRandom(userSeedNum + i);
        const seed2 = seededRandom(userSeedNum + i + 1000);
        const finalSeed = (seed1 + seed2) / 2;
        const j = Math.floor(finalSeed * (i + 1));
        ;[shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
    }

    console.log('User seed used:', userSpecificSeed);
    console.log('Initial userSeedNum:', userSeedNum);

    bingoItems.value = [
        ...shuffledItems.slice(0, 12),
        { text: freeSpace, selected: true, free: true }, // Free space is selected
        ...shuffledItems.slice(12)
    ];

    // Also update the store's selection to include the center square (index 12)
    if (!store.versus.includes(12)) {
      store.versus.push(12);
    }
  };

  const generateRandomBoard = (seed?: string) => {
    currentMode.value = MODE_NAMES.random;
    showCountdown.value = false;
    
    if (!seed) {
      console.error('No seed provided for random board generation');
      return;
    }

    let seedNum = parseInt(seed, 36);
    const randomFunc = () => seededRandom(seedNum++);
    
    const { items, freeSpace } = generateBoard(randomFunc);
    const shuffledItems = [...items].sort(() => randomFunc());

    bingoItems.value = [
      ...shuffledItems.slice(0, 12),
      { text: freeSpace, selected: true, free: true }, // Free space is selected
      ...shuffledItems.slice(12)
    ];

    // Also update the store's selection to include the center square (index 12)
    if (!store.random.includes(12)) {
      store.random.push(12);
    }
  };

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