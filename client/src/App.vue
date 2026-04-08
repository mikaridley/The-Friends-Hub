<template>
  <div class="app">
    <Header :site-name="siteName" :pages="pages" :current-index="currentPageIndex" @navigate="currentPageIndex = $event" />
    <main class="main">
      <component :is="currentPageComponent" />
    </main>
    
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Header from './cmps/Header.vue'
import EliasPage from './pages/EliasPage.vue'

const siteName = ref("The Friends Hub")
const pages = ref(["Elias"])
const currentPageIndex = ref(0)
const currentPageComponent = computed(() => [EliasPage][currentPageIndex.value])
</script>

<style>
/* Elias: full-viewport turn tint when the game view sets classes on the page root */
.app:has(.elias-page--turn-red) {
  background-color: var(--clr-turn-bg-red);
  transition: background-color 0.35s ease;
}

.app:has(.elias-page--turn-blue) {
  background-color: var(--clr-turn-bg-blue);
  transition: background-color 0.35s ease;
}

.app:has(.elias-page--bg-finished) {
  background-color: var(--clr-turn-bg-finished);
  transition: background-color 0.35s ease;
}
</style>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: minmax(var(--margin-inline),1fr) minmax(auto,var(--max-width)) minmax(var(--margin-inline),1fr);
  min-height: 100vh;

  > * {
  grid-column: 2;
}

:first-child,:last-child {
  grid-column: 1/-1;
}

}
</style>
