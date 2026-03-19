---
name: explaining-commands
description: Explains bash commands found in instruction files to help the user understand and remember them. Use whenever commands are added to documentation or instruction files.
---

# Bash Command Explainer

## When to use this skill
- When creating or updating markdown instruction files (like `README.md`, `INSTRUCTIONS.md`, etc.) that contain bash commands.
- When the user asks for explanations of terminal commands to better understand them.

## Workflow
- [ ] Identify all bash commands being presented to the user.
- [ ] Break down complex commands (using pipes `|`, flags `-aux`, etc.) into their individual components.
- [ ] Add a dedicated section or inline comments explaining each component of the command clearly.
- [ ] Ensure the language is straightforward and conversational to build the user's confidence in using the terminal.

## Instructions
When you include commands like `ps aux | grep python` in an instruction file, you MUST include a breakdown of what each part means to help the user learn.

**Example Breakdown Format:**
If the command is `ps aux | grep python`:
* **`ps`**: Stands for "Process Status". It lists the currently running programs on your computer.
* **`aux`**: These are flags (options) given to `ps`.
  * `a`: Shows processes for all users.
  * `u`: Displays the user who owns the process and memory usage details.
  * `x`: Shows processes running in the background (not attached to your current terminal window).
* **`|`**: Called a "Pipe". It creatively takes the text output from the first command (`ps aux`) and feeds it directly into the next command as input.
* **`grep`**: Stands for "Global Regular Expression Print". It's a search tool that looks through text to find a specific word.
* **`python`**: The word we are looking for. So `grep python` filters the massive list of processes to only show the ones with "python" in their name.

**Principles:**
1. Break commands into their smallest functional pieces.
2. Explain the literal meaning/acronym if it helps memory (e.g., *grep*, *ps*).
3. Be encouraging and caring in your tone, like a supportive friend explaining how it works.
