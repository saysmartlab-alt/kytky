// Service worker – přijímá push oznámení a zobrazuje je jako banner.

self.addEventListener('push', (event) => {
  let data = { title: '🌱 Naše kytky', body: 'Čas zkontrolovat kytky.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title || '🌱 Naše kytky', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kytky-zalivka',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
