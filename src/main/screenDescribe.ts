import { ipcMain } from 'electron'

// Instead of starting an Express server, use IPC to communicate with the renderer process
// ipcMain.handle('screen-describe', async () => {})
import { OpenAI } from 'openai'
import { desktopCapturer, screen } from 'electron'
import fs from 'fs'
import { configDotenv } from 'dotenv'

configDotenv()

const openai = new OpenAI()

ipcMain.handle('screen-describe', async () => {
  try {
    // Capture the entire screen
    const primaryDisplay = screen.getPrimaryDisplay()
    console.log(primaryDisplay)
    const { width, height } = primaryDisplay.size
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    })
    const source = sources[0]

    // Save the screenshot to a file
    const screenshotPath = '/tmp/screenshot.png'
    fs.writeFileSync(screenshotPath, source.thumbnail.toPNG())
    console.log(screenshotPath)
    // Send the screenshot to OpenAI for analysis
    console.log('sending to openai')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'You are Ui parsing ai Describe this screenshot in the necessary detail:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${fs.readFileSync(screenshotPath, 'base64')}`
              }
            }
          ]
        }
      ]
    })
    console.log(response.choices[0].message.content)

    // Clean up the temporary file
    fs.unlinkSync(screenshotPath)

    // Return the AI's description
    return {
      success: true,
      content: response.choices[0].message.content,
      type: 'screen-description'
    }
  } catch (error) {
    console.error('Error in screen-describe:', error)
    return {
      success: false,
      error: 'Unable to describe the screen.',
      type: 'screen-description'
    }
  }
})
