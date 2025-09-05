
import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab } from 'obsidian';
import { GeminiAgentSettingTab } from './settings';
import { fetchGeminiResult } from './api';

/**
 * Interface for the plugin's settings.
 */
interface GeminiAgentSettings {
	apiKey: string;
}

/**
 * Default values for the plugin settings.
 */
const DEFAULT_SETTINGS: GeminiAgentSettings = {
	apiKey: ''
}

/**
 * The main class for the Gemini Agent plugin.
 * This class handles the lifecycle of the plugin, including loading, unloading,
 * command registration, and settings management.
 */
export default class GeminiAgentPlugin extends Plugin {
	settings: GeminiAgentSettings;

	/**
	 * This method is called when the plugin is first loaded.
	 * It loads settings, adds the settings tab, and registers the main command.
	 */
	async onload() {
		await this.loadSettings();

		this.addSettingTab(new GeminiAgentSettingTab(this.app, this));

		this.addCommand({
			id: 'run-with-selection',
			name: 'Gemini: Run with selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selectedText = editor.getSelection();
				this.processInstructions(selectedText, (result) => editor.replaceSelection(result));
			}
		});

		this.registerMarkdownCodeBlockProcessor("gemini", (source, el, ctx) => {
			const sourceLines = source.split('\n');
			const pre = el.createEl("pre");
			const code = pre.createEl("code");
			for(const line of sourceLines) {
				code.createEl("div", {text: line});
			}
			
			const controls = el.createDiv("gemini-controls");
			const runButton = controls.createEl("button", {
				text: "Run",
				cls: "mod-cta"
			});

			runButton.addEventListener("click", () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					this.processInstructions(source, (result) => {
						const section = ctx.getSectionInfo(el);
						if (section) {
							const endLine = section.lineEnd;
							view.editor.replaceRange(result, { line: endLine + 1, ch: 0 }, { line: endLine + 1, ch: 0 });
						}
					});
				}
			});
		});
	}

	/**
	 * Processes the context and instruction, calls the API, and executes a callback with the result.
	 * @param fullText The entire text containing context and instruction.
	 * @param resultCallback A function to call with the AI's response.
	 */
	private async processInstructions(fullText: string, resultCallback: (result: string) => void) {
		// 1. Input Validation: Check for API Key
		if (!this.settings.apiKey) {
			new Notice("Gemini API key is not set. Please configure it in the plugin settings.");
			return;
		}

		if (!fullText) {
			new Notice("The selection or code block is empty.");
			return;
		}

		if (!fullText.includes('>>')) {
			new Notice("Instruction marker '>>' not found.");
			return;
		}

		// 2. Parsing Logic
		const parts = fullText.split('>>');
		const context = parts[0].trim();
		const instruction = parts.slice(1).join('>>').trim();

		if (!instruction) {
			new Notice("Instruction is empty. Please provide an instruction after the '>>' marker.");
			return;
		}

		// 3. API Call and Result Handling
		const thinkingNotice = new Notice("Requesting from Gemini...", 0);
		try {
			const result = await fetchGeminiResult(this.settings.apiKey, context, instruction);
			thinkingNotice.hide();

			if (result && result.trim()) {
				resultCallback(result.trim());
				new Notice("Task completed successfully.");
			} else {
				new Notice("Received an empty response from the AI.");
			}
		} catch (error) {
			thinkingNotice.hide();
			console.error("Gemini API call failed:", error);
			new Notice("Error during API call. Check the API key and your network connection.");
		}
	}

	/**
	 * This method is called when the plugin is unloaded.
	 */
	onunload() {
	}

	/**
	 * Loads the plugin settings from Obsidian's storage.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Saves the plugin settings to Obsidian's storage.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
