export function parseUrl(input: string): string {
  // Remove leading/trailing whitespace
  const url = input.trim()

  // If empty, return about:blank
  if (!url) {
    return 'about:blank'
  }

  // Handle special cases
  if (url === 'localhost') {
    return 'http://localhost'
  }

  // Handle about: URLs
  if (url.startsWith('about:')) {
    return url
  }

  // Handle chrome: URLs
  if (url.startsWith('chrome:')) {
    return url
  }

  // Handle file: URLs
  if (url.startsWith('file:')) {
    return url
  }

  // Handle URLs that already have a protocol
  if (/^[a-zA-Z]+:\/\//.test(url)) {
    return url
  }

  // Handle IP addresses (both IPv4 and IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/
  const ipv6Regex = /^\[([a-fA-F0-9:]+)\](:\d+)?$/
  if (ipv4Regex.test(url) || ipv6Regex.test(url)) {
    return `http://${url}`
  }

  // Handle localhost with port
  if (/^localhost(:\d+)?/.test(url)) {
    return `http://${url}`
  }

  // Handle search queries
  if (/\s/.test(url) || !url.includes('.')) {
    const searchQuery = encodeURIComponent(url)
    return `https://www.google.com/search?q=${searchQuery}`
  }

  // Handle domain names without protocol
  // First, remove any paths, queries, or hashes from the URL to check the domain
  const domainPart = url.split(/[/?#]/)[0]

  // Check if it's a valid domain name
  const domainRegex = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/
  if (domainRegex.test(domainPart)) {
    return `https://${url}`
  }

  // If all else fails, treat it as a search query
  return `https://www.google.com/search?q=${encodeURIComponent(url)}`
}
