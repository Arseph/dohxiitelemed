import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import store from './store'
// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)
app.use(store);
// Mount vue app
app.mount('#app')
