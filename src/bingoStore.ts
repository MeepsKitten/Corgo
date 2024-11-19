import { defineStore } from 'pinia'

export const useBingoStore = defineStore('bingo', {
  state: () => ({
    boardDates: {
      daily: new Date().toISOString(),
      versus: new Date().toISOString(),
      random: new Date().toISOString(),
    },
    daily: [] as number[],
    versus: [] as number[],
    random: [] as number[],
    randomSeed: '',
    versusSeed: null as { date: string, seed: string } | null,
  }),

  actions: {
    toggleSelection(mode: 'daily' | 'versus' | 'random', index: number) {
      const selection = this[mode]
      const idx = selection.indexOf(index)
      if (idx > -1) {
        selection.splice(idx, 1)
      } else {
        selection.push(index)
      }
    },

    setSelection(mode: 'daily' | 'versus' | 'random', index: number, selected: boolean) {
      if (selected && !this[mode].includes(index)) {
        this[mode].push(index)
      } else if (!selected) {
        const idx = this[mode].indexOf(index)
        if (idx > -1) {
          this[mode].splice(idx, 1)
        }
      }
    },

    clearRandomSeed() {
      this.randomSeed = ''
    },

    clearVersusSeed() {
      this.versusSeed = null
    }
  },

  persist: true
})