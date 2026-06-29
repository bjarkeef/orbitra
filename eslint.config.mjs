// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Portfolio app: allow pragmatic typing while migrating surfaces
    '@typescript-eslint/no-explicit-any': 'off',
    // ActorGraph canvas sim uses non-reactive instance fields
    '@typescript-eslint/ban-ts-comment': [
      'error',
      { 'ts-nocheck': false, 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
    ],
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/attributes-order': 'off',
    'vue/require-default-prop': 'off',
    // Canvas / sim code uses intentional underscore-prefixed instance fields
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
})
