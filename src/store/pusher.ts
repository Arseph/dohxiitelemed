import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'pusher',
  key: '0b758fd17aaeea982810',
  cluster: 'ap2',
  forceTLS: true,
})

export default echo
