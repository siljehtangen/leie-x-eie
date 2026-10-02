import { afterEach } from 'vitest'

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  // jsdom has no layout engine, so the browser APIs used by charts and scrolling are stubbed.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
  window.HTMLElement.prototype.scrollIntoView ??= () => {}
  window.scrollTo = () => {}
}
