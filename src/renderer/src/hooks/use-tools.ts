/* eslint-disable @typescript-eslint/explicit-function-return-type */
'use client'

import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { animate as framerAnimate } from 'framer-motion'
// import { useTranslations } from '@renderer/components/translations-context'
import FirecrawlApp, { ScrapeResponse } from '@mendable/firecrawl-js'

export const useToolsFunctions = () => {
  const t = (val): string => {
    return val
  }

  const timeFunction = () => {
    const now = new Date()
    console.log('time called')
    return {
      success: true,
      time: now.toLocaleTimeString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      message:
        t('tools.time') +
        now.toLocaleTimeString() +
        ' in ' +
        Intl.DateTimeFormat().resolvedOptions().timeZone +
        ' timezone.'
    }
  }

  const backgroundFunction = () => {
    try {
      const html = document.documentElement
      const currentTheme = html.classList.contains('dark') ? 'dark' : 'light'
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark'

      html.classList.remove(currentTheme)
      html.classList.add(newTheme)

      toast(`Switched to ${newTheme} mode! 🌓`, {
        description: t('tools.switchTheme') + newTheme + '.'
      })

      return {
        success: true,
        theme: newTheme,
        message: t('tools.switchTheme') + newTheme + '.'
      }
    } catch (error) {
      return {
        success: false,
        message: t('tools.themeFailed') + ': ' + error
      }
    }
  }

  const partyFunction = () => {
    try {
      const duration = 5 * 1000
      const colors = [
        '#a786ff',
        '#fd8bbc',
        '#eca184',
        '#f8deb1',
        '#3b82f6',
        '#14b8a6',
        '#f97316',
        '#10b981',
        '#facc15'
      ]

      const confettiConfig = {
        particleCount: 30,
        spread: 100,
        startVelocity: 90,
        colors,
        gravity: 0.5
      }

      const shootConfetti = (angle: number, origin: { x: number; y: number }) => {
        confetti({
          ...confettiConfig,
          angle,
          origin
        })
      }

      const animate = () => {
        const now = Date.now()
        const end = now + duration

        const elements = document.querySelectorAll('div, p, button, h1, h2, h3')
        elements.forEach((element) => {
          framerAnimate(
            element,
            {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            },
            {
              duration: 0.5,
              repeat: 10,
              ease: 'easeInOut'
            }
          )
        })

        const frame = () => {
          if (Date.now() > end) return
          shootConfetti(60, { x: 0, y: 0.5 })
          shootConfetti(120, { x: 1, y: 0.5 })
          requestAnimationFrame(frame)
        }

        const mainElement = document.querySelector('main')
        if (mainElement) {
          mainElement.classList.remove('bg-gradient-to-b', 'from-gray-50', 'to-white')
          const originalBg = mainElement.style.backgroundColor

          const changeColor = () => {
            const now = Date.now()
            const end = now + duration

            const colorCycle = () => {
              if (Date.now() > end) {
                framerAnimate(mainElement, { backgroundColor: originalBg }, { duration: 0.5 })
                return
              }
              const newColor = colors[Math.floor(Math.random() * colors.length)]
              framerAnimate(mainElement, { backgroundColor: newColor }, { duration: 0.2 })
              setTimeout(colorCycle, 200)
            }

            colorCycle()
          }

          changeColor()
        }

        frame()
      }

      animate()
      toast.success(t('tools.partyMode.toast') + ' 🎉', {
        description: t('tools.partyMode.description')
      })
      return { success: true, message: t('tools.partyMode.success') + ' 🎉' }
    } catch (error) {
      return { success: false, message: t('tools.partyMode.failed') + ': ' + error }
    }
  }

  const launchWebsite = ({ url }: { url: string }) => {
    window.open(url, '_blank')
    toast(t('tools.launchWebsite') + ' 🌐', {
      description: t('tools.launchWebsiteSuccess') + url + ", tell the user it's been launched."
    })
    return {
      success: true,
      message: `Launched the site${url}, tell the user it's been launched.`
    }
  }

  const copyToClipboard = ({ text }: { text: string }) => {
    navigator.clipboard.writeText(text)
    toast(t('tools.clipboard.toast') + ' 📋', {
      description: t('tools.clipboard.description')
    })
    return {
      success: true,
      text,
      message: t('tools.clipboard.success')
    }
  }

  const scrapeWebsite = async ({ url }: { url: string }) => {
    const apiKey = await window.electron.ipcRenderer.invoke(
      'get-env-variable',
      'PUBLIC_FIRECRAWL_API_KEY'
    )
    console.log(apiKey)
    try {
      const app = new FirecrawlApp({ apiKey: apiKey })
      const scrapeResult = (await app.scrapeUrl(url, {
        formats: ['markdown', 'html']
      })) as ScrapeResponse

      if (!scrapeResult.success) {
        console.log(scrapeResult.error)
        return {
          success: false,
          message: `Failed to scrape: ${scrapeResult.error}`
        }
      }
      console.log(scrapeResult)

      toast.success(t('tools.scrapeWebsite.toast') + ' 📋', {
        description: t('tools.scrapeWebsite.success')
      })

      return {
        success: true,
        message:
          'Here is the scraped website content: ' +
          JSON.stringify(scrapeResult.markdown) +
          'Summarize and explain it to the user now in a response.'
      }
    } catch (error) {
      return {
        success: false,
        message: `Error scraping website: ${error}`
      }
    }
  }

  const toogleGridOverlay = async (): Promise<void> => {
    console.log('tool exists')
    try {
      // Send IPC message to create window and get window ID
      await window.electron.ipcRenderer.invoke('toggle-grid-overlay')
    } catch (error) {
      console.error('Failed to create grid overlay:', error)
    }
  }

  const ScreenDescriber = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await window.electron.ipcRenderer.invoke('screen-describe')
      if (response.success) {
        return {
          success: true,
          message: response.content
        }
      }
      return {
        success: false,
        message: response.error
      }
    } catch (error) {
      return {
        success: false,
        message: `Error reading screen: ${error}`
      }
    }
  }
  const MoveMouse = ({ x, y }: { x: string; y: number }): void => {
    try {
      window.electron.ipcRenderer.invoke('move-mouse : ', x, ':', y)
    } catch (error) {
      console.error('Failed to move mouse:', error)
    }
  }
  const ClickMouse = ({ clickType }: { clickType: string }): void => {
    try {
      window.electron.ipcRenderer.invoke('click-mouse : ', clickType)
    } catch (error) {
      console.error('Failed to click mouse:', error)
    }
  }
  const TypeWithKeyboard = ({ text }: { text: string }): void => {
    try {
      window.electron.ipcRenderer.invoke('type-Keyboard : ', text)
    } catch (error) {
      console.error('Failed to type:', error)
    }
  }

  return {
    timeFunction,
    backgroundFunction,
    partyFunction,
    launchWebsite,
    copyToClipboard,
    scrapeWebsite,
    toogleGridOverlay,
    ScreenDescriber,
    MoveMouse,
    ClickMouse,
    TypeWithKeyboard
  }
}
