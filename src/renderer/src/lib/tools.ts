// Add interface for tools
interface Tool {
  type: 'function'
  name: string
  description: string
  parameters?: {
    type: string
    properties: Record<
      string,
      {
        type: string
        description: string
      }
    >
  }
}

const toolDefinitions = {
  getCurrentTime: {
    description: "Gets the current time in the user's timezone",
    parameters: {}
  },
  changeBackgroundColor: {
    description: 'Changes the background color of the page',
    parameters: {
      color: {
        type: 'string',
        description: 'Color value (hex, rgb, or color name)'
      }
    }
  },
  partyMode: {
    description: 'Triggers a confetti animation on the page',
    parameters: {}
  },
  launchWebsite: {
    description: "Launches a website in the user's browser",
    parameters: {
      url: {
        type: 'string',
        description: 'The URL to launch'
      }
    }
  },
  copyToClipboard: {
    description: "Copies text to the user's clipboard",
    parameters: {
      text: {
        type: 'string',
        description: 'The text to copy'
      }
    }
  },
  takeScreenshot: {
    description: 'Takes a screenshot of the current page',
    parameters: {}
  },
  scrapeWebsite: {
    description: 'Scrapes a URL and returns content in markdown and HTML formats',
    parameters: {
      url: {
        type: 'string',
        description: 'The URL to scrape'
      }
    }
  },
  toogleGridOverlay: {
    description: 'Toggles a grid overlay on the screen',
    parameters: {}
  },
  ScreenDescriber: {
    description:
      'This is a Model that looks at the screen and describes the screen and the elements on it and return descriptions of the elements.',
    parameters: {}
  },
  MoveMouse: {
    description: 'Moves the mouse to a specific location on the screen',
    parameters: {
      x: {
        type: 'String',
        description: 'The x coordinate to move the mouse to'
      },
      y: {
        type: 'number',
        description: 'The y coordinate to move the mouse to'
      }
    }
  },
  ClickMouse: {
    description: 'Trigger a mouse click of the either type left click, right click, middle click',
    parameters: {
      clickType: {
        type: 'String',
        description: 'The type of click to perform'
      }
    }
  },
  TypeWithKeyboard: {
    description: 'Types a string with the keyboard',
    parameters: {
      text: {
        type: 'String',
        description: 'The text to type'
      }
    }
  }
} as const

const tools: Tool[] = Object.entries(toolDefinitions).map(([name, config]) => ({
  type: 'function',
  name,
  description: config.description,
  parameters: {
    type: 'object',
    properties: config.parameters
  }
}))

export type { Tool }
export { tools }
