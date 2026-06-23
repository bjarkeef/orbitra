<template>
  <div class="orbitra-shell min-h-screen flex flex-col bg-slate-800">
    <UITheHeader />
    <div class="flex-1 text-slate-200 w-full">
      <slot />
    </div>
    <UITheFooter />
  </div>
</template>
