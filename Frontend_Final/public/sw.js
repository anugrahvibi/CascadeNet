// Cascadenet Tactical Service Worker v2.0
// Designed for background distress polling even when the app is closed

const BACKEND_URL = '/api/v1/ml/alerts/summary';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('Tactical SW Installed');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('Tactical SW Activated');
    startBackgroundPoll();
});

// Periodic background polling logic to catch SOS even if the tab is closed/killed
function startBackgroundPoll() {
    setInterval(async () => {
        try {
            const response = await fetch(BACKEND_URL);
            if (!response.ok) return;

            const data = await response.json();
            const actionPlans = data.action_plan?.action_plans || [];
            const distress = actionPlans.find(a => a.is_distress);

            if (distress) {
                const tStamp = distress.timestamp || 'sos-alert';
                // Check if notification permission is granted
                if (Notification.permission === 'granted') {
                    showSOSNotification(distress);
                }
            }
        } catch (err) {
            // Background poll fail (expected if offline or tunnel down)
        }
    }, 10000); // Poll every 10 seconds in background
}

function showSOSNotification(distress) {
    const title = '📩 TRACE: EMERGENCY-SOS';
    const options = {
        body: `[TACTICAL SMS] ALERT: ${distress.action}. DEPLOY IMMEDIATELY.`,
        icon: '/logo.svg',
        badge: '/favicon.svg',
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40, 500],
        tag: 'emergency-sos-background',
        renotify: true,
        requireInteraction: true,
        data: { url: '/ndrf' }
    };

    self.registration.showNotification(title, options);
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a tab is already open, focus it and redirect
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if ('focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // If no tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle push events
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    showSOSNotification(data);
});
