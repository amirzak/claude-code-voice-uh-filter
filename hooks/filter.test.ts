import { describe, expect, test } from 'claude-code/testing'

import { cleanInsertedText, dropTypedFiller, stripFillers } from './filter'

describe('stripFillers', () => {
  test('drops fillers and their trailing commas', () => {
    expect(stripFillers('Please uh, take a look at uh, the latest uh, announcement.')).toBe(
      'Please take a look at the latest announcement.',
    )
  })

  test('collapses stutter repeats', () => {
    expect(stripFillers('check check online where you where you can edit')).toBe(
      'check online where you can edit',
    )
  })

  test('keeps legitimate doubled words', () => {
    expect(stripFillers('I know that that works')).toBe('I know that that works')
  })

  test('recapitalizes after a leading filler', () => {
    expect(stripFillers('Um, can you fix it')).toBe('Can you fix it')
  })

  test('leaves uh-huh, words containing um, and code alone', () => {
    expect(stripFillers('uh-huh, the album has `um uh` in it')).toBe('uh-huh, the album has `um uh` in it')
  })

  test('keeps a prompt that is only filler', () => {
    expect(stripFillers('uh')).toBe('uh')
  })
})

test('rewrites the prompt that reaches the model', async ($, on) => {
  let seen = ''
  on('prompt.submit', ($, e) => {
    seen = e.text
    return { text: e.text }
  })

  await $.prompt.submit({ text: 'Um, please uh, run run the tests', wait: false, origin: { kind: 'composer' } })

  expect(seen).toBe('Please run the tests')
})

test('drops mm and mmm', () => {
  expect(stripFillers('I say mm a lot, mmm, really')).toBe('I say a lot, really')
})

describe('cleanInsertedText', () => {
  test('cleans a dictated chunk and keeps its edge spaces', () => {
    expect(cleanInsertedText(' uh, take a look at um the docs ')).toBe(' take a look at the docs ')
  })

  test('empties a chunk that is only filler', () => {
    expect(cleanInsertedText('um, uh ')).toBe('')
  })

  test('leaves clean chunks alone', () => {
    expect(cleanInsertedText('take a look')).toBeUndefined()
  })

  test('leaves single characters alone', () => {
    expect(cleanInsertedText('m')).toBeUndefined()
  })

  test('leaves pasted code alone', () => {
    expect(cleanInsertedText('const mm = um(1)')).toBeUndefined()
    expect(cleanInsertedText('uh first line\nsecond line')).toBeUndefined()
  })
})

describe('dropTypedFiller', () => {
  test('drops a filler word when a space ends it', () => {
    expect(dropTypedFiller({ text: 'hello um ', cursor: 9 })).toEqual({ text: 'hello ', cursor: 6 })
  })

  test('drops it with its comma, mid-draft', () => {
    expect(dropTypedFiller({ text: 'I said, um, there', cursor: 12 })).toEqual({ text: 'I said, there', cursor: 8 })
  })

  test('drops a filler at the very start', () => {
    expect(dropTypedFiller({ text: 'mm ', cursor: 3 })).toEqual({ text: '', cursor: 0 })
  })

  test('leaves real words alone', () => {
    expect(dropTypedFiller({ text: 'the album ', cursor: 10 })).toBeUndefined()
    expect(dropTypedFiller({ text: 'uh-huh ', cursor: 7 })).toBeUndefined()
  })

  test('leaves fillers inside inline code alone', () => {
    expect(dropTypedFiller({ text: 'run `um ', cursor: 8 })).toBeUndefined()
  })
})
