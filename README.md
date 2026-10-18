# claude-code-voice-uh-filter

A Claude Code mod that removes spoken filler words from your prompts, made for voice dictation.

## What it does

- **On send:** strips `uh`, `um`, `uhm`, `erm`, `hmm`, `mm` (and their trailing commas) plus stutter repeats like "check check" or "where you where you" before the prompt reaches the model.
- **In the terminal prompt box:** dictated or pasted text is cleaned as it lands, and a filler you type disappears as soon as you type the space after it.
- **Leaves alone:** words like "album" or "uh-huh", common real doubles ("that that", "had had"), anything inside backticks or code blocks, pasted code, and slash commands.

To keep a literal "um" in a prompt, put it in backticks.

The desktop app draws its own prompt box, so there the cleanup happens only when you send.

## Hooks

The mod is one hooks module, `hooks/register.ts`, with two hooks:

- `prompt.submit`: rewrites the text of every prompt you send, removing fillers and stutter repeats. It skips slash commands and prompts Claude Code sends on its own. Since `prompt.submit` is also a call other plugins can make (`$.prompt.submit`), prompts that other plugins submit pass through this cleanup too.
- `prompt.edit`: in the terminal prompt box, cleans text that lands in one go (dictation, a paste of plain prose) and drops a filler word when you type the space after it. Pasted code and anything inside backticks is left as is.

It reads no files, runs no commands, and sends nothing anywhere.

## Install

At the prompt of a terminal Claude Code session:

```
/plugin install uh-filter --marketplace amirzak/claude-code-voice-uh-filter
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```bash
claude plugin install uh-filter --marketplace amirzak/claude-code-voice-uh-filter
```

In the desktop app: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `amirzak/claude-code-voice-uh-filter`, then **Add plugin**.

## Develop

```bash
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```

## License

MIT
