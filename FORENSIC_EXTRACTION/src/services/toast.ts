export function showToast(message: string, timeout = 3000) {
  try {
    const containerId = 'hostelpro-toasts'
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      container.style.position = 'fixed'
      container.style.top = '20px'
      container.style.right = '20px'
      container.style.zIndex = '9999'
      document.body.appendChild(container)
    }
    const el = document.createElement('div')
    el.style.background = 'rgba(15,23,42,0.95)'
    el.style.color = 'white'
    el.style.padding = '8px 12px'
    el.style.marginTop = '8px'
    el.style.borderRadius = '8px'
    el.style.boxShadow = '0 6px 18px rgba(2,6,23,0.6)'
    el.textContent = message
    container.appendChild(el)
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease'
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 300)
    }, timeout)
  } catch (err) {
    console.error('showToast error', err)
  }
}

export default { showToast }
