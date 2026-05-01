import { FirebaseMessaging } from '@capacitor-firebase/messaging'

export async function requestNotificationPermission(): Promise<string | null> {
  const { receive } = await FirebaseMessaging.requestPermissions()
  if (receive !== 'granted') return null
  const { token } = await FirebaseMessaging.getToken({
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  })
  return token
}

export function onForegroundMessage(
  callback: (payload: unknown) => void
): () => void {
  const listener = FirebaseMessaging.addListener(
    'notificationReceived',
    callback
  )
  return () => { listener.then(l => l.remove()) }
}
