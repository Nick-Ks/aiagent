
import { App, PluginSettingTab, Setting } from "obsidian";
import GeminiAgentPlugin from "./main"; // Adjust this import to your plugin's main class

/**
 * Defines the settings UI for the Gemini Agent plugin.
 * This class is responsible for creating the form where users can input their API key.
 */
export class GeminiAgentSettingTab extends PluginSettingTab {
    plugin: GeminiAgentPlugin;

    /**
     * Constructs the setting tab.
     * @param app - The Obsidian application instance.
     * @param plugin - The instance of the main plugin class.
     */
    constructor(app: App, plugin: GeminiAgentPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Renders the settings UI.
     * This method is called by Obsidian to display the settings content.
     */
    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Contextual Command Agent Settings" });

        new Setting(containerEl)
            .setName("Gemini API Key")
            .setDesc("Enter your Google Gemini API key. You can get one from Google AI Studio.")
            .addText(text => text
                .setPlaceholder("Enter your API key here...")
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    // Update the setting value and save it to the plugin's data.
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));
    }
}
