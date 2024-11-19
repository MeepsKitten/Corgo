import { defineStore } from 'pinia'

interface BingoSelection {
  daily: number[]
  versus: number[]
  random: number[]
  randomSeed?: string
  versusSeed?: {
    seed: string
    date: string  // Store as ISO string
  }
}

interface State {
  daily: number[]
  versus: number[]
  random: number[]
  randomSeed?: string
  versusSeed?: {
    seed: string
    date: string  // Store as ISO string
  }
  boardDates: {
    daily: string;
    versus: string;
    random: string;
  };
}

export const useBingoStore = defineStore('bingo', {
  state: (): State => ({
    daily: [],
    versus: [],
    random: [],
    randomSeed: undefined,
    versusSeed: undefined,
    boardDates: {
      daily: new Date().toISOString(),
      versus: '',
      random: ''
    }
  }),
  
  actions: {
    toggleSelection(mode: keyof BingoSelection, index: number) {
      const selections = this[mode]
      if (!Array.isArray(selections)) return;
      const existingIndex = selections.indexOf(index)
      
      if (existingIndex === -1) {
        selections.push(index)
      } else {
        selections.splice(existingIndex, 1)
      }
    },
    setSelection(mode: keyof BingoSelection, index: number, selected: boolean) {
        const selections = this[mode]
        if (!Array.isArray(selections)) return;
        const existingIndex = selections.indexOf(index)
        
        if (selected && existingIndex === -1) {
          selections.push(index)
        } else if (!selected && existingIndex !== -1) {
          selections.splice(existingIndex, 1)
        }
      },
    clearRandomSeed() {
        this.randomSeed = undefined
        this.random = []
      },

    clearVersusSeed() {
      this.versusSeed = undefined
      this.versus = []
    }
  },
  
  persist: {
    key: 'bingo',
    storage: localStorage,
  }
})