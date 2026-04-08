<template>
  <header class="app-header">
    <div class="logo">
      <a href="#" @click.prevent="$emit('navigate', 0)">
        <span class="logo-text">{{ siteName }}</span>
      </a>
    </div>
    <nav class="navigation">
      <a
        v-for="(p, idx) in pages"
        :key="p + '-' + idx"
        href="#"
        class="nav-link"
        :class="{ active: currentIndex === idx }"
        @click.prevent="$emit('navigate', idx)"
      >
        {{ p }}
      </a>
    </nav>
  </header>
</template>
<script setup>
defineEmits(['navigate'])
defineProps({
  currentIndex: { type: Number, default: 0 },
  pages: { type: Array, default: () => ['Home', 'About', 'Contact'] },
  siteName: { type: String, default: 'YourBrand' },
})
</script>
<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-inline: 5rem;
  padding-block: 2rem;

  .logo {
    width: 200px;
    .logo-text {
      font-weight: 700;
      color: var(--prime-text);
      display: inline-block;
    }
  }

  .navigation {
    display: flex;
    align-items: center;
    gap: 3rem;

    .nav-link {
      position: relative;
      padding: 1rem;
      color: var(--prime-text);
      text-decoration: none;

      &::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 5px;
        transform: translateX(-50%);
        width: 0;
        height: 1px;
        background: currentColor;
        transition: width 0.2s ease;
      }

      &:hover::after,
      &.active::after {
        width: 90%;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@media (max-width: $mq-md) {
  .app-header {
    background-color: red;
  }
}
</style>
