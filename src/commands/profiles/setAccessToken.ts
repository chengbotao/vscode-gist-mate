/*
 * @Author: Chengbotao
 * @Description:
 * @Contact: https://github.com/chengbotao
 */
import { commands, ExtensionContext, Uri, window } from "vscode";
import { logger } from "../../logger/logger";
import { ProfileCommands } from "../commands";

export const create = [
	ProfileCommands.setToken,
	async (context: ExtensionContext) => {
		try {
			const { value } = (await window.showInformationMessage(
				"需要 GitHub Access Token 才能使用此功能。\n" +
					'Token 需要包含 "gist" 权限。',
				{ modal: true }, // 使用模态对话框强制用户选择
				{ title: "跳转到 GitHub 获取", value: "GET", isCloseAffordance: false },
				{ title: "手动输入 Token", value: "SET", isCloseAffordance: true }
			)) || { value: "SET" };

			if (value === "GET") {
				await commands.executeCommand(
					"vscode.open",
					Uri.parse("https://github.com/settings/tokens/new?" + "scopes=gist&description=GistMate Extension")
				);
			}

			const accessToken = await window.showInputBox({
				title: "GitHub 认证",
				prompt: "请输入你的 GitHub Access Token",
				placeHolder: "ghp_",
				password: true,
				validateInput: (value) => {
					if (!value || value.trim().length === 0) {
						return "Token 不能为空";
					}
					if (!value.startsWith("ghp_")) {
						return "无效的 Token 格式";
					}
					return null;
				},
			});
			if (!accessToken) {
				window.showInformationMessage("需要 GitHub Access Token 才能继续");
				return false;
			} else {
				await context.secrets.store("gistMateToken", accessToken);
				return true;
			}
		} catch (error) {
			// 记录错误日志
			logger.error(ProfileCommands.setToken, error);
		}
	},
] as const;
