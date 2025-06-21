/*
 * @Author: Chengbotao
 * @Description:
 * @Contact: https://github.com/chengbotao
 */
import { commands, ExtensionContext, window } from "vscode";
import { ProfileCommands } from "../commands/commands";

export async function withAccessToken(context: ExtensionContext) {
	const token = await context.secrets.get("gistMateToken");
	if (token) {
		return true;
	}
	return await commands.executeCommand(ProfileCommands.setToken) as boolean;
}
