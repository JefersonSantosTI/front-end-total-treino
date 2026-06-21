self.addEventListener('push', (event) => {
    if (!event.data) return;
  
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200], // Faz o celular vibrar
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        { action: 'close', title: 'Fechar' }
      ]
    };
  
    // ✅ O segredo está aqui: o event.waitUntil segura o processo vivo
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });