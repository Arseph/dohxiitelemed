import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.employee.dohsox',
  appName: 'DOH XII Portal',
  webDir: 'dist',
  server: {
    url: 'https://employee.dohsox.com',
    cleartext: true,
  }
};

export default config;
