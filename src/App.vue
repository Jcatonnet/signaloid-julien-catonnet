<template>
  <div class="min-h-screen flex items-center justify-center bg-primary">
    <div class="w-full max-w-md">
      <CurrencyConverterForm />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CurrencyConverterForm from "./components/CurrencyConverterForm.vue";

export default defineComponent({
  name: "App",
  components: {
    CurrencyConverterForm,
  },
});
</script>

<style scoped>
/* Add global styles if needed */
</style>
