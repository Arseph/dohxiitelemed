import { breakpointsVuetify } from '@vueuse/core'
import { useTheme } from 'vuetify'
import { VIcon } from 'vuetify/components/VIcon'
import { Skins } from '@core/enums'
import { defineThemeConfig } from '@core'

import { AppContentLayoutNav, ContentWidth, FooterType, NavbarType } from '@layouts/enums'

// Circular DOH Telemedicine logo, as on the login page: the navy disc in light mode,
// the mint disc in dark mode so it keeps its edge against a dark navbar.
// Served from public/assets; BASE_URL keeps it working under a sub-path.
const AppLogo = defineComponent({
  name: 'AppLogo',
  setup() {
    const theme = useTheme()

    return () => h('img', {
      src: `${import.meta.env.BASE_URL}assets/${theme.current.value.dark ? 'telemed-logo-on-dark.png' : 'telemed-logo.png'}`,
      alt: 'DOH Telemedicine',
      style: 'width: 32px; height: 32px',
    })
  },
})

export const { themeConfig, layoutConfig } = defineThemeConfig({
  app: {
    title: 'telemedicine',
    logo: h(AppLogo),
    contentWidth: ContentWidth.Boxed,
    contentLayoutNav: AppContentLayoutNav.Horizontal,
    overlayNavFromBreakpoint: breakpointsVuetify.md + 16, // 16 for scrollbar. Docs: https://next.vuetifyjs.com/en/features/display-and-platform/
    i18n: {
      enable: false,
      defaultLocale: 'en',
      langConfig: [
        {
          label: 'English',
          i18nLang: 'en',
          isRTL: false,
        },
        {
          label: 'French',
          i18nLang: 'fr',
          isRTL: false,
        },
        {
          label: 'Arabic',
          i18nLang: 'ar',
          isRTL: true,
        },
      ],
    },
    theme: 'system',
    skin: Skins.Default,
    iconRenderer: VIcon,
  },
  navbar: {
    type: NavbarType.Sticky,
    navbarBlur: true,
  },
  footer: { type: FooterType.Static },
  verticalNav: {
    isVerticalNavCollapsed: false,
    defaultNavItemIconProps: { icon: 'tabler-circle' },
    isVerticalNavSemiDark: false,
  },
  horizontalNav: {
    type: 'sticky',
    transition: 'slide-y-reverse-transition',
    popoverOffset: 6,
  },

  /*
  // ℹ️  In below Icons section, you can specify icon for each component. Also you can use other props of v-icon component like `color` and `size` for each icon.
  // Such as: chevronDown: { icon: 'tabler-chevron-down', color:'primary', size: '24' },
  */
  icons: {
    chevronDown: { icon: 'tabler-chevron-down' },
    chevronRight: { icon: 'tabler-chevron-right', size: 20 },
    close: { icon: 'tabler-x' },
    verticalNavPinned: { icon: 'tabler-circle-dot' },
    verticalNavUnPinned: { icon: 'tabler-circle' },
    sectionTitlePlaceholder: { icon: 'tabler-minus' },
  },
})
