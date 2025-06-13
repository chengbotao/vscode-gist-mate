/*
 * @Author: Chengbotao
 * @Description: 
 * @Contact: https://github.com/chengbotao
 */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {ExtensionContext, window, ExtensionMode, commands} from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = commands.registerCommand('vscode-gist-mate.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		window.showInformationMessage('Hello VSCode from GistMate!');
	});

	context.subscriptions.push(disposable);

	const disposables = commands.registerCommand('vscode-gist-mate.showDate', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const date = new Date();
		window.showWarningMessage(date.toDateString());
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
