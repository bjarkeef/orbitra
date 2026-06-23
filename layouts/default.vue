<template>
  <div class="orbitra-shell min-h-screen flex flex-col">
    <UITheHeader />
    <section class="bg-slate-800 flex-1 text-slate-200">
      <slot />
    </section>
    <UITheFooter />
  </div>
</template>
