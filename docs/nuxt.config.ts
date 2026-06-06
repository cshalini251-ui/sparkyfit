import { resolve } from 'path'

const resolvePath = (p: string) => resolve(__dirname, p).replace(/\\/g, '/')

export default defineNuxtConfig({
  // https://github.com/nuxt-themes/docus
  extends: ['@nuxt-themes/docus'],

  devtools: { enabled: true },

  modules: [
    // Remove it if you don't use Plausible analytics
    // https://github.com/nuxt-modules/plausible
    //'@nuxtjs/plausible'
  ],

  compatibilityDate: '2024-09-07',

  imports: {
    imports: [
      {
        name: 'useDocus',
        from: resolvePath('node_modules/@nuxt-themes/docus/composables/useDocus.ts')
      },
      {
        name: 'useMenu',
        from: resolvePath('node_modules/@nuxt-themes/docus/composables/useMenu.ts')
      },
      {
        name: 'useScrollspy',
        from: resolvePath('node_modules/@nuxt-themes/docus/composables/useScrollspy.ts')
      },
      {
        name: 'useDocSearch',
        from: resolvePath('node_modules/@nuxt-themes/docus/composables/useDocSearch.ts')
      }
    ]
  }
})