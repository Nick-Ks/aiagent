# Future Improvements & Task List

This document outlines the roadmap for enhancing the Contextual Command Agent plugin.

## 1. Current Workflow Review

The MVP implementation is functional but relies on a workflow that can be cumbersome.

-   **Current Flow:** Manually select both context and instruction (`>> ...`), then run the command from the palette.
-   **Pain Point:** The manual selection process is inefficient, especially for longer contexts, and disrupts the writing flow.

## 2. Proposed Improvement Plans (Task List)

Here are the proposed features to improve usability, ordered by recommended priority.

### Task 1: (High Priority) Implement Code Block Assistant

-   **Concept:** Create a dedicated `gemini` code block for AI interactions. The plugin will process the entire content of the block, eliminating the need for manual selection.
-   **User Experience:**
    1.  User creates a code block: ` ```gemini `
    2.  Inside, they write the context and the `>>` instruction.
    3.  A "Run" button appears on the code block, or a command/hotkey runs the AI task when the cursor is inside the block.
    4.  The result either replaces the code block or is inserted below it.
-   **Benefits:** No manual selection, clear visual boundary for AI tasks, intuitive "Run" button UX.

### Task 2: (Medium Priority) Add Dedicated Hotkey

-   **Concept:** Allow users to assign a custom hotkey (e.g., `Ctrl+Shift+G`) to the "Run with selection" command.
-   **User Experience:** Select text, press the hotkey.
-   **Benefits:** Speeds up the current workflow by removing the need to open the command palette. It's a significant quality-of-life improvement for the existing feature.

### Task 3: (Exploratory) Automatic Context Detection

-   **Concept:** The user places their cursor on an instruction line (`>> ...`) and runs a command. The plugin automatically identifies the paragraph(s) above it as context.
-   **User Experience:** Write context, write instruction, place cursor on instruction line, press hotkey.
-   **Benefits:** Potentially the fastest workflow with zero selection.
-   **Challenges:** The logic for "what is the context" can be ambiguous and may not always match user intent. This requires careful design of the context detection rules (e.g., stop at headings, empty lines, etc.).

### Task 4: (Low Priority) Add Right-Click Context Menu

-   **Concept:** After selecting text, the user can right-click and find the "Gemini: Run with selection" command in the context menu.
-   **Benefits:** Improves discoverability for mouse-oriented users.
-   **Implementation:** This is a relatively simple addition via the Obsidian API.
