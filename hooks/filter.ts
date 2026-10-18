// Spoken fillers, matched as whole tokens: "uh", "uhh", "um", "umm", "uhm", "erm", "hmm", "mm".
// A hyphen on either side leaves it alone, so "uh-huh" and "uh-oh" survive.
const FILLER = /(?<![\w-])(?:u+h+m*|u+m+|e+r+m+|h+m+|m{2,})(?![\w-])[,.]?/gi

// One to three words said twice in a row: "check check", "where you where you".
const REPEAT = /\b(\w+(?:\s+\w+){0,2})(?:[\s,]+\1\b)+/gi

// Single words that legitimately double up in English.
const KEEP_DOUBLED = new Set(['that', 'had', 'is', 'do', 'very', 'no', 'bye'])

// Inline code and fenced blocks are passed through untouched.
const CODE = /(```[\s\S]*?```|`[^`\n]*`)/

function cleanProse(text: string): string {
  return text
    .replace(FILLER, '')
    .replace(REPEAT, (match, phrase: string) =>
      !phrase.includes(' ') && KEEP_DOUBLED.has(phrase.toLowerCase()) ? match : phrase,
    )
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/([,;:])(?:\s*[,;:])+/g, '$1')
    .replace(/^[ \t]*[,;:][ \t]*/gm, '')
    .replace(/[ \t]+(?=\n)/g, '')
}

export function stripFillers(text: string): string {
  const cleaned = text
    .split(CODE)
    .map((part, i) => (i % 2 === 1 ? part : cleanProse(part)))
    .join('')
    .trim()

  if (cleaned === '') {
    return text
  }

  const wasCapitalized = /^[A-Z]/.test(text.trimStart())

  return wasCapitalized ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned
}

// Only plain spoken prose: letters, digits, spaces and sentence punctuation.
// Anything else (braces, operators, newlines) is likely pasted code and kept as is.
const PROSE = /^[\p{L}\p{N} ,.'’?!-]+$/u

// Cleans a chunk landing in the prompt box at once (dictation or a paste),
// keeping its edge spaces so it still joins the draft around it.
// Returns undefined when the chunk should go in untouched.
export function cleanInsertedText(inputText: string): string | undefined {
  if (inputText.length < 2 || !PROSE.test(inputText)) {
    return undefined
  }

  const lead = /^ */.exec(inputText)?.[0] ?? ''
  const trail = / *$/.exec(inputText)?.[0] ?? ''
  const body = inputText.trim()
  const cleaned = stripFillers(body)

  if (cleaned === body) {
    return FILLER_ONLY.test(body) ? '' : undefined
  }

  return lead + cleaned + trail
}

// A chunk that is nothing but fillers, which stripFillers keeps rather than empty.
const FILLER_ONLY = /^(?:(?:u+h+m*|u+m+|e+r+m+|h+m+|m{2,})[,.]?\s*)+$/i

// The word just before the caret, when it is a filler followed by the space just typed.
const TYPED_FILLER = /(^|\s)((?:u+h+m*|u+m+|e+r+m+|h+m+|m{2,})[,.]?) $/i

// After a space is typed: drops the filler word it ends, with that space,
// so "hello um " becomes "hello ". Skipped inside an open inline-code span.
export function dropTypedFiller(box: { text: string; cursor: number }): { text: string; cursor: number } | undefined {
  const before = box.text.slice(0, box.cursor)
  const match = TYPED_FILLER.exec(before)
  const isInCode = (before.match(/`/g)?.length ?? 0) % 2 === 1

  if (!match || isInCode) {
    return undefined
  }

  const start = box.cursor - (match[2]?.length ?? 0) - 1

  return { text: box.text.slice(0, start) + box.text.slice(box.cursor), cursor: start }
}
