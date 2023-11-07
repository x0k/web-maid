import { noop } from '@/lib/function'

// export {}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, noop)
})
