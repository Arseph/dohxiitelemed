interface Globals {
  api: string
  socket: string
}

export const globals: Globals = {
  // Local dev — uncomment one pair as needed:
  // api: 'http://127.0.0.1:8000',
  // socket: 'http://127.0.0.1:3000',
  // api: 'http://10.10.124.140:8000', // LOCAL TEST CED
  // socket: 'http://10.10.124.140:3000', // ced local test

  // LIVE — same origin as the frontend; Laravel answers /api/*, socket.io is
  // reverse-proxied at /socket.io/ on the same host.
  api: 'https://telemed.doh12.com',
  socket: 'https://telemed.doh12.com',
}
