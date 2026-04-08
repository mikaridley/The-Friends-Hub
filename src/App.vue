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

const siteName = ref("My Website")
const pages = ref(["Elias"])
const currentPageIndex = ref(0)
const currentPageComponent = computed(() => [EliasPage][currentPageIndex.value])
</script>

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
