import { ipcMain } from 'electron'
import robot from 'robotjs'

// Configure robot.js settings
robot.setMouseDelay(2)
robot.setKeyboardDelay(2)

// Mouse control handlers
ipcMain.handle('move-mouse', (_event, x: string, y: number) => {
  try {
    // Convert string x coordinate to number and validate coordinates
    const xCoordGrid = (x.toLowerCase().charCodeAt(0) - 96) % 16

    const xCoord = xCoordGrid * 120 - 60
    // if (isNaN(xCoord)) {
    //   throw new Error('Invalid x coordinate')
    // }

    // Move mouse to specified coordinates
    robot.moveMouse(xCoord, y * 120 - 60)
    return { success: true }
  } catch (error) {
    console.error('Failed to move mouse:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('click-mouse', (_event, clickType: string) => {
  try {
    // Validate and process click type
    const validClickTypes = ['left', 'right', 'middle']
    if (!validClickTypes.includes(clickType.toLowerCase())) {
      throw new Error('Invalid click type. Must be left, right, or middle.')
    }

    // Perform mouse click
    switch (clickType.toLowerCase()) {
      case 'left':
        robot.mouseClick()
        break
      case 'right':
        robot.mouseClick('right')
        break
      case 'middle':
        robot.mouseClick('middle')
        break
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to perform mouse click:', error)
    return { success: false, error: error.message }
  }
})

// Keyboard control handler
ipcMain.handle('type-keyboard', (_event, text: string) => {
  try {
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('Invalid text input')
    }

    // Type the text
    robot.typeString(text)
    return { success: true }
  } catch (error) {
    console.error('Failed to type text:', error)
    return { success: false, error: error.message }
  }
})

// Special key press handler (for future expansion)
ipcMain.handle('press-key', (_event, key: string) => {
  try {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid key input')
    }

    // Press the specified key
    robot.keyTap(key)
    return { success: true }
  } catch (error) {
    console.error('Failed to press key:', error)
    return { success: false, error: error.message }
  }
})


// Configure robot.js settings
robot.setMouseDelay(2)
robot.setKeyboardDelay(2)

// Mouse control handlers
ipcMain.handle('move-mouse', (_event, x: string, y: number) => {
  try {
    // Convert string x coordinate to number and validate coordinates
    const xCoord = parseInt(x, 10)
    if (isNaN(xCoord)) {
      throw new Error('Invalid x coordinate')
    }

    // Move mouse to specified coordinates
    robot.moveMouse(xCoord, y)
    return { success: true }
  } catch (error) {
    console.error('Failed to move mouse:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('click-mouse', (_event, clickType: string) => {
  try {
    // Validate and process click type
    const validClickTypes = ['left', 'right', 'middle']
    if (!validClickTypes.includes(clickType.toLowerCase())) {
      throw new Error('Invalid click type. Must be left, right, or middle.')
    }

    // Perform mouse click
    switch (clickType.toLowerCase()) {
      case 'left':
        robot.mouseClick()
        break
      case 'right':
        robot.mouseClick('right')
        break
      case 'middle':
        robot.mouseClick('middle')
        break
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to perform mouse click:', error)
    return { success: false, error: error.message }
  }
})

// Keyboard control handler
ipcMain.handle('type-keyboard', (_event, text: string) => {
  try {
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('Invalid text input')
    }

    // Type the text
    robot.typeString(text)
    return { success: true }
  } catch (error) {
    console.error('Failed to type text:', error)
    return { success: false, error: error.message }
  }
})

// Special key press handler (for future expansion)
ipcMain.handle('press-key', (_event, key: string) => {
  try {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid key input')
    }

    // Press the specified key
    robot.keyTap(key)
    return { success: true }
  } catch (error) {
    console.error('Failed to press key:', error)
    return { success: false, error: error.message }
  }
})
