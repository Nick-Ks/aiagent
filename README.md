# Contextual Command Agent for Obsidian

## Core Concept

This plugin is an **inline contextual assistant**. It allows you to designate a piece of text within your notes as "context" and a subsequent line as an "instruction." The AI then understands this context, performs the instruction, and replaces your selection with the result.

It's designed for quick, in-place transformations, summaries, explanations, or content generation without leaving your note-taking flow.

## Features

This plugin offers two ways to interact with the Gemini AI.

### 1. Code Block Assistant (Recommended)

This is the easiest way to use the plugin, as it doesn't require manual text selection.

1.  **Create a `gemini` code block:**
    ````
    ```gemini
    Context: The quick brown fox jumps over the lazy dog.
    
    >> Summarize the above sentence in one word.
    ```
    ````
2.  **Run:** Click the "Run" button that appears at the top of the code block.
3.  **Get Result:** The AI-generated output will be inserted directly below the code block.

### 2. Command-Based Workflow

This method is useful for applying AI actions to existing text anywhere in your notes.

1.  **Prepare Your Text:** In any note, write your context text. Immediately following it, on a new line, type `>>` followed by your instruction.
2.  **Select the Text:** Select the entire block of text, including both the context and the instruction line.
3.  **Run the Command:** Open the Command Palette (`Ctrl+P` or `Cmd+P`) and search for `Gemini: Run with selection`. Press Enter.
4.  **Get the Result:** The selected text will be replaced by the AI-generated output.

## Pro-Tip: Set a Hotkey

To make the command-based workflow much faster, you can assign a keyboard shortcut (hotkey) to the `Gemini: Run with selection` command.

1.  Go to `Settings` > `Hotkeys`.
2.  Search for `Gemini: Run with selection`.
3.  Click the `+` icon to record your preferred hotkey (e.g., `Ctrl+Shift+G`).

Now you can simply select your text and press the hotkey to run the command.

## Setup: Adding Your API Key

This plugin requires a Google Gemini API key to function.

1.  **Get Your API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Create a new API key.

2.  **Enter the Key in Obsidian:**
    *   Go to `Settings` > `Community Plugins`.
    *   Find "Contextual Command Agent" and click the `Options` tab.
    *   Paste your API key into the "Gemini API Key" field.
    *   Close the settings. The key is saved automatically.

That's it! You're ready to start using the plugin.
