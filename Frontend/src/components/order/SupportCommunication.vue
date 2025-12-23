<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  historyItems: {
    type: Array,
    default: () => []
  }
})

const adminNotes = computed(() => {
  const notes = []
  const history = props.historyItems || []

  const noteEntries = history.filter(h => h.type === 'ORDER_NOTE')
  noteEntries.forEach((noteEntry, index) => {
    notes.push({
      id: `note-${index}`,
      date: formatDate(noteEntry.createdAt),
      message: noteEntry.data.note || ''
    })
  })

  return notes
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
</script>

<template>
    <div v-if="adminNotes.length" class="border border-black rounded-lg overflow-hidden">
      <h2 class="text-xl font-bold p-4 border-b border-black">Support Communication</h2>
      <div class="flex flex-col gap-3 p-4">
        <div v-for="note in adminNotes" :key="note.id" class="border border-gray-300 rounded p-3">
          <p class="text-xs text-gray-600 mb-1">{{ note.date }}</p>
          <p class="text-sm whitespace-pre-wrap"><span class="font-semibold">Support: </span>{{ note.message }}</p>
        </div>
      </div>
    </div>
</template>