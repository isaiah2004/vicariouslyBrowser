import { ipcMain } from 'electron'


// Instead of starting an Express server, use IPC to communicate with the renderer process
ipcMain.handle('get-ephemeral-token', async () => {
  const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'verse'
    })
  })
  return await r.json()
})
