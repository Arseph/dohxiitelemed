// store/types.ts

export interface AppState {

  // Define state properties for app module
}

export interface AuthState {
  checked: boolean
  user: any // Replace `any` with a proper type
}

export interface RootState {
  app: AppState
  auth: AuthState

  // Define other state modules
}
