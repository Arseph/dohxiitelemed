<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useStore } from 'vuex'
import { getAuthToken } from '@/utils/authStorage'
import '@fontsource/atkinson-hyperlegible-next/400.css'
import '@fontsource/atkinson-hyperlegible-next/500.css'
import '@fontsource/atkinson-hyperlegible-next/700.css'
import type { ThemeSwitcherTheme } from '@layouts/types'

definePage({
  meta: {
    layout: 'blank',
  },
})

const form = ref({
  username: '',
  password: '',
  remember: false,
})

const store = useStore()
const router = useRouter()

const isPasswordVisible = ref(false)
const showAlert = ref<boolean>(false)
const alertMessage = ref<string>('')
const loadingButton = ref<boolean>(false)
const capsLockOn = ref<boolean>(false)

onMounted(() => {
  if (getAuthToken())
    router.replace('/homes')
})

// Bubbles up from the password field, so it works however AppTextField forwards events.
const checkCapsLock = (event: KeyboardEvent) => {
  capsLockOn.value = event.getModifierState?.('CapsLock') ?? false
}

const submit = async () => {
  showAlert.value = false

  if (!form.value.username || !form.value.password) {
    alertMessage.value = 'Please provide your username and password.'
    showAlert.value = true

    return
  }

  loadingButton.value = true
  try {
    await store.dispatch('auth/login', form.value)

    // Keep the button disabled until /homes has loaded, so a second click
    // can't send a second login and replace the token just issued.
    await router.push('/homes')
  }
  catch (error: any) {
    loadingButton.value = false

    if (!error.response) {
      alertMessage.value = 'Unable to reach the server. Please check your connection and try again.'
    }
    else {
      alertMessage.value = error.response.data?.has_token
        ? 'Account logged in to another device. Please contact administrator.'
        : 'Invalid username or password. Please try again.'
    }

    showAlert.value = true
  }
}

// Circular DOH Telemedicine logo. Light theme gets the navy disc; dark theme gets the
// mint disc so it keeps its edge against a dark surface.
const theme = useTheme()
const isDarkTheme = computed(() => theme.global.current.value.dark)

// Served from public/assets, so these are plain URLs rather than bundled imports.
// BASE_URL keeps them working if the app is ever deployed under a sub-path.
const logoOnLight = `${import.meta.env.BASE_URL}assets/telemed-logo.png`
const logoOnDark = `${import.meta.env.BASE_URL}assets/telemed-logo-on-dark.png`
const logoSrc = computed(() => (isDarkTheme.value ? logoOnDark : logoOnLight))

// The side panel keeps the regional DOH XII seal next to the "DOH XII TELEMED" name
const regionalSeal = `${import.meta.env.BASE_URL}ro12.png`

// The blank layout has no navbar, so the login page carries its own theme switcher.
// Same Vuexy component the navbar uses, so the choice is saved and carries over after sign-in.
const themes: ThemeSwitcherTheme[] = [
  { name: 'light', icon: 'tabler-sun-high' },
  { name: 'dark', icon: 'tabler-moon-stars' },
  { name: 'system', icon: 'tabler-device-laptop' },
]
</script>

<template>
  <div
    class="login-page"
    :class="isDarkTheme ? 'is-dark' : 'is-light'"
  >
    <div class="theme-toggle">
      <ThemeSwitcher :themes="themes" />
    </div>

    <!-- Stage: full panel on desktop, compact band on mobile -->
    <aside class="stage">
      <!-- Terrain contours: a static SVG painted through a CSS mask so it takes the theme colour -->
      <div
        class="stage__terrain"
        aria-hidden="true"
      />

      <svg
        class="stage__map"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <!-- One consult: a community health center reaching a referral hospital -->
        <path
          class="signal"
          pathLength="1"
          d="M240 590 C 380 650, 470 380, 760 430"
        />
        <!-- Idle loop: a short bright dash travels the same route every few seconds -->
        <path
          class="signal-pulse"
          pathLength="1"
          d="M240 590 C 380 650, 470 380, 760 430"
        />
        <circle
          class="station-ring"
          cx="240"
          cy="590"
          r="8"
        />
        <circle
          class="station"
          cx="240"
          cy="590"
          r="8"
        />
        <g class="hospital">
          <circle
            class="hospital__ring"
            cx="760"
            cy="430"
            r="18"
          />
          <circle
            class="hospital__dot"
            cx="760"
            cy="430"
            r="18"
          />
          <path
            class="hospital__cross"
            d="M754 430h12M760 424v12"
          />
        </g>
        <text
          class="map-label"
          x="262"
          y="624"
        >Community health center</text>
        <text
          class="map-label map-label--end"
          x="736"
          y="400"
        >Referral hospital</text>
      </svg>

      <div class="stage__content">
        <div class="stage__brand">
          <img
            :src="regionalSeal"
            alt=""
            width="32"
            height="32"
          >
          <span class="stage__name">DOH XII TELEMED</span>
        </div>

        <div class="stage__copy">
          <p class="stage__footer">
            Department of Health
          </p>
        </div>
      </div>
    </aside>

    <!-- Form -->
    <main class="sheet">
      <div class="sheet__inner">
        <img
          class="sheet__logo"
          :src="logoSrc"
          alt="DOH Telemedicine"
          width="170"
          height="170"
        >

        <h1 class="sheet__title">
          Sign in
        </h1>
        <p class="sheet__lead">
          Use your TELEMED account.
        </p>

        <VExpandTransition>
          <VAlert
            v-if="showAlert"
            color="error"
            variant="tonal"
            closable
            density="comfortable"
            icon="tabler-alert-circle"
            class="mb-6"
            role="alert"
            @click:close="showAlert = false"
          >
            {{ alertMessage }}
          </VAlert>
        </VExpandTransition>

        <VForm @submit.prevent="submit">
          <div class="sheet__field">
            <AppTextField
              v-model="form.username"
              autofocus
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              label="Username"
              type="text"
              placeholder="Enter your username"
            />
          </div>

          <div
            class="sheet__field"
            @keydown="checkCapsLock"
            @keyup="checkCapsLock"
          >
            <AppTextField
              v-model="form.password"
              autocomplete="current-password"
              label="Password"
              placeholder="Enter your password"
              :type="isPasswordVisible ? 'text' : 'password'"
              :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
              @click:append-inner="isPasswordVisible = !isPasswordVisible"
            />
            <p
              v-if="capsLockOn"
              class="sheet__hint"
              role="status"
            >
              Caps Lock is on.
            </p>
          </div>

          <div class="sheet__row">
            <VCheckbox
              v-model="form.remember"
              label="Remember me"
              hide-details
            />
            <RouterLink
              class="sheet__link"
              to="/forget-password"
            >
              Forgot password?
            </RouterLink>
          </div>

          <VBtn
            block
            size="large"
            type="submit"
            class="sheet__submit"
            :loading="loadingButton"
            :disabled="loadingButton"
          >
            Sign in
          </VBtn>
        </VForm>

        <p class="sheet__help">
          Trouble signing in? Ask your facility's TELEMED administrator.<br>
          Authorized personnel only.
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  // Light theme (default): Mint Cream > Honeydew-blue > Steel Blue, with Soft/Deep Navy ink and Health Blue signal
  --stage-gradient: linear-gradient(155deg, #eefaf6 0%, #d4e4e7 42%, #8fb0cf 100%);
  --stage-bg: #d4e4e7; // solid mid-tone for label halos and the hospital cross
  --stage-line: #365175;
  --stage-line-minor: 0.32;
  --stage-line-major: 0.6;
  --stage-signal: #0b4baa; // Health Blue Accent
  --stage-ink: #1f2a45; // Deep Navy
  --stage-glow: radial-gradient(45% 40% at 28% 22%, rgba(255, 255, 255, 0.75), transparent 70%);

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  background: rgb(var(--v-theme-surface));
  font-family: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif;

  // Make Vuetify controls use the page typeface
  :deep(input),
  :deep(button),
  :deep(.v-label),
  :deep(.v-alert),
  :deep(.v-btn),
  :deep(.v-field) {
    font-family: inherit;
  }

  // 16px inputs stop iOS Safari zooming the page on focus
  :deep(input) {
    font-size: 1rem;
  }

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    grid-template-rows: none;
  }

  // Dark theme: Steel Blue > Soft Navy > Deep Navy, white ink, Heritage Yellow signal
  &.is-dark {
    --stage-gradient: linear-gradient(155deg, #587ca5 0%, #365175 48%, #1f2a45 100%);
    --stage-bg: #365175;
    --stage-line: #c6d8f0;
    --stage-line-minor: 0.45;
    --stage-line-major: 0.85;
    --stage-signal: #ffd700;
    --stage-ink: #fff;
    --stage-glow: radial-gradient(45% 40% at 28% 22%, rgba(150, 190, 240, 0.38), transparent 70%);

    // The brand green is the same in both themes and nearly vanishes on the dark surface
    // (focused labels, outlines, the link). Lift it to a mint here only; the Sign in
    // button keeps the brand green so its white label stays readable.
    // Fields re-declare theme variables on their own .v-theme--dark element, so set it there too.
    .sheet__field,
    .sheet__field :deep(.v-field),
    .sheet__row,
    .sheet__row :deep(.v-selection-control) {
      --v-theme-primary: 138, 216, 182;
    }
  }
}

/* ---------- Theme switcher ---------- */
// A small surface-coloured pill, so it stays visible over the stage band on phones
// and over the plain form background on desktop.
.theme-toggle {
  position: fixed;
  z-index: 10;
  display: flex;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  inset-block-start: calc(0.75rem + env(safe-area-inset-top));
  inset-inline-end: 0.75rem;
  padding: 0.125rem;

  @media (min-width: 960px) {
    inset-block-start: 1.25rem;
    inset-inline-end: 1.5rem;
  }
}

/* ---------- Stage ---------- */
.stage {
  position: relative;
  overflow: hidden;
  color: var(--stage-ink);
  background: var(--stage-gradient);
  min-block-size: clamp(148px, 22dvh, 200px);

  // Soft light that drifts slowly across the gradient while the page sits idle
  &::before {
    content: "";
    position: absolute;
    inset: -25%;
    pointer-events: none;
    background: var(--stage-glow);
    animation: glow-drift 28s ease-in-out infinite alternate;
  }

  &__map {
    position: absolute;
    inset: 0;
    block-size: 100%;
    inline-size: 100%;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    block-size: 100%;
    gap: 2rem;
    padding: 1.25rem 1.25rem 2.25rem;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__name {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  // The footer only earns its space on larger screens
  &__copy {
    display: none;
  }

  &__footer {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  @media (min-width: 960px) {
    min-block-size: 100vh;
    min-block-size: 100dvh;

    &__content {
      padding: 3rem 4rem;
    }

    &__name {
      font-size: 1.2rem;
    }

    &__copy {
      display: block;
    }
  }
}

/* Contour map */
// The SVG is an alpha mask (major lines opaque, minor lines at ~half), so the lines take
// --stage-line and this element's opacity sets the overall strength per theme.
// `100% 100%` lets the SVG's own preserveAspectRatio="xMidYMid slice" crop it exactly
// like the inline map above, so the route and dots stay aligned with the terrain.
.stage__terrain {
  position: absolute;
  inset: 0;
  background: var(--stage-line);
  mask: url("@images/pages/login-contours.svg") center / 100% 100% no-repeat;
  opacity: var(--stage-line-major);
  pointer-events: none;
  transform-origin: center;
  animation: terrain-drift 32s ease-in-out infinite alternate;
}

.signal {
  fill: none;
  stroke: var(--stage-signal);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: signal-draw 2.2s cubic-bezier(0.65, 0, 0.35, 1) 0.5s backwards;
}

.signal-pulse {
  fill: none;
  stroke: #fff;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 0.1 2;
  stroke-dashoffset: 0.1;
  opacity: 0;
  animation: pulse-travel 9s ease-in-out 5s infinite;
}

.station {
  fill: var(--stage-signal);
}

.station-ring {
  fill: none;
  stroke: var(--stage-signal);
  stroke-width: 2;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: station-ping 9s linear 5s infinite;
}

.hospital {
  &__dot {
    fill: var(--stage-ink);
  }

  &__cross {
    fill: none;
    stroke: var(--stage-bg);
    stroke-width: 3.5;
    stroke-linecap: round;
  }

  &__ring {
    fill: none;
    stroke: var(--stage-signal);
    stroke-width: 2;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    animation:
      hospital-ping 1.4s ease-out 2.7s backwards,
      hospital-idle 9s linear 5s infinite;
  }
}

.map-label {
  fill: var(--stage-ink);
  font-size: 22px;
  font-weight: 500;
  paint-order: stroke;
  stroke: var(--stage-bg);
  stroke-linejoin: round;
  stroke-width: 7px;

  &--end {
    text-anchor: end;
  }

  // Too small to read on a phone-width band
  @media (max-width: 959.98px) {
    display: none;
  }
}

@keyframes signal-draw {
  from {
    stroke-dashoffset: 1;
  }

  to {
    stroke-dashoffset: 0;
  }
}

@keyframes hospital-ping {
  0% {
    opacity: 0.9;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(2.6);
  }
}

// Idle loop, 9s: station pings (0%), a bright dash travels the route (1-20%), hospital pings on arrival (20%)
@keyframes pulse-travel {
  0% {
    opacity: 0;
    stroke-dashoffset: 0.1;
  }

  1% {
    opacity: 1;
  }

  20% {
    opacity: 1;
    stroke-dashoffset: -1;
  }

  21%,
  100% {
    opacity: 0;
    stroke-dashoffset: -1;
  }
}

@keyframes station-ping {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }

  10%,
  100% {
    opacity: 0;
    transform: scale(2.8);
  }
}

@keyframes hospital-idle {
  0%,
  19% {
    opacity: 0;
    transform: scale(1);
  }

  20% {
    opacity: 0.9;
    transform: scale(1);
  }

  32%,
  100% {
    opacity: 0;
    transform: scale(2.6);
  }
}

@keyframes terrain-drift {
  from {
    transform: translate(0, 0) scale(1);
  }

  to {
    transform: translate(-14px, 10px) scale(1.025);
  }
}

@keyframes glow-drift {
  from {
    transform: translate(-4%, -2%) scale(1);
  }

  to {
    transform: translate(10%, 8%) scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .signal,
  .signal-pulse,
  .station-ring,
  .hospital__ring,
  .stage__terrain,
  .stage::before {
    animation: none;
  }
}

/* ---------- Form sheet ---------- */
.sheet {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1.25rem calc(2rem + env(safe-area-inset-bottom));

  // On phones the form slides up over the stage like a bottom sheet
  margin-block-start: -1.25rem;
  border-start-end-radius: 20px;
  border-start-start-radius: 20px;
  background: rgb(var(--v-theme-surface));

  &__inner {
    inline-size: 100%;
    max-inline-size: 26rem;
  }

  // Shrinks with its column but always stays round
  &__logo {
    display: block;
    block-size: auto;
    inline-size: 170px;
    max-inline-size: 100%;
    margin: 0 auto 1.25rem;
    aspect-ratio: 1;

    // Smaller on phones so the Sign in button sits higher on the first screen
    @media (max-width: 959.98px) {
      inline-size: 128px;
    }
  }

  &__title {
    margin: 0 0 0.25rem;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.15;
  }

  &__lead {
    margin: 0 0 1.75rem;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  }

  &__field + &__field {
    margin-block-start: 1.25rem;
  }

  &__hint {
    margin: 0.5rem 0 0;
    color: rgb(var(--v-theme-warning));
    font-size: 0.875rem;
    font-weight: 500;
  }

  &__row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    margin-block: 0.75rem 1.25rem;
  }

  &__link {
    padding-block: 0.5rem; // 44px+ touch target
    color: rgb(var(--v-theme-primary));
    font-weight: 500;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }

  &__submit {
    min-block-size: 48px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: normal;
    text-transform: none; // match the "Sign in" heading instead of Vuexy's "Sign In"
  }

  // Real information (who to contact, access policy), so readable rather than "disabled" grey
  &__help {
    margin: 2rem 0 0;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
    font-size: 0.85rem;
    line-height: 1.5;
  }

  @media (min-width: 960px) {
    align-items: center;
    padding: 3rem 4rem;
    margin-block-start: 0;
    border-radius: 0;

    &__title {
      font-size: 2.25rem;
    }
  }
}
</style>
