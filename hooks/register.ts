import type { Register } from 'claude-code'

import { cleanInsertedText, dropTypedFiller, stripFillers } from './filter'

export const register: Register = on => {
  // Terminal prompt box. A chunk landing at once (dictation, a paste) is cleaned
  // before it shows; when typing, a filler word goes as soon as a space ends it.
  on('prompt.edit', async ($, e, next) => {
    if (!e.key) {
      const inputText = cleanInsertedText(e.inputText)

      return next(inputText === undefined ? e : { ...e, inputText })
    }

    const box = await next(e)
    const isTypedSpace = e.inputText === ' ' && e.start === e.end

    return (isTypedSpace && dropTypedFiller(box)) || box
  })

  // Last pass on submit, for anything the box didn't catch (and for the desktop app,
  // whose prompt box mods can't reach).
  on('prompt.submit', ($, e, next) => {
    // Slash commands ignore a rewrite, and meta prompts aren't the person's words.
    if (e.command || e.isMeta) {
      return next(e)
    }

    let text = e.text
    try {
      text = stripFillers(e.text)
    } catch {
      // A filter bug must never cost the person their prompt.
    }

    return next(text === e.text ? e : { ...e, text })
  })
}
