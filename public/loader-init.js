var loaderColor = localStorage.getItem('vuexy-initial-loader-bg') || '#FFFFFF'
var primaryColor = localStorage.getItem('vuexy-initial-loader-color') || '#7367F0'

if (loaderColor)
  document.documentElement.style.setProperty('--initial-loader-bg', loaderColor)

if (primaryColor)
  document.documentElement.style.setProperty('--initial-loader-color', primaryColor)
