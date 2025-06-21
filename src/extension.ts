/*
 * @Author: Chengbotao
 * @Description:
 * @Contact: https://github.com/chengbotao
 */
import {
	ExtensionContext,
	window,
	ExtensionMode,
	commands,
	Disposable,
} from "vscode";
import { logger } from "./logger/logger";
import { supportedCommands } from "./commands";

const disposables: { commands: Disposable[]; listeners: Disposable[] } = {
	commands: [],
	listeners: [],
};
export function activate(context: ExtensionContext) {
	logger.configure(
		{
			name: "GistMate",
			createChannel(name) {
				const channel = window.createOutputChannel(name);
				context.subscriptions.push(channel);
				return channel;
			},
		},
		"debug",
		context.extensionMode === ExtensionMode.Development
	);
	logger.debug("extension activate");
	disposables.commands = supportedCommands.map((supportedCommand) => {
		const [command, commandInit] = supportedCommand;
		const disposable = commands.registerCommand(command, ()=>{
			return commandInit(context);
		});
		context.subscriptions.push(disposable);
		return disposable;
	});
}

// This method is called when your extension is deactivated
export function deactivate() {
	disposables.commands.forEach((d) => d.dispose());
}
