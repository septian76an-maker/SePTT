export async function notifyUpdate(topic: string, title: string, body: string, data?: any) {
  try {
    const response = await fetch('/api/fcm/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, title, body, data })
    });
    if (!response.ok) {
      console.error("FCM API responded with error:", await response.text());
    }
  } catch (err) {
    console.error("Failed to call FCM notify API:", err);
  }
}
