/*
 * @Author: Chengbotao
 * @Description:
 * @Contact: https://github.com/chengbotao
 */
import * as path from "path";
import { Octokit } from "@octokit/rest";
import { ExtensionContext, window, workspace } from "vscode";
import { logger } from "../../logger/logger";
import { GistCommands } from "../commands";
import { withAccessToken } from "../../middlewares/withAccessToken";

export const create = [
	GistCommands.create,
	async (context: ExtensionContext) => {
		try {
			if (!(await withAccessToken(context))) {
				return;
			}
			const octokit = new Octokit({
				baseUrl: "https://api.github.com",
				auth: await context.secrets.get("gistMateToken"),
			});

			// 获取当前活动的文本编辑器
			const editor = window.activeTextEditor;
			// 检查是否有打开的文件
			if (!editor) {
				throw new Error("在创建 Gist 前请先打开一个文件");
			}
			// 获取文档对象
			const document = editor.document;
			// 判断是否为新创建的编辑器（未关联到文件系统）
			const isNewlyCreated = document.isUntitled;
			// 获取不带路径的文件名
			const fileName = isNewlyCreated ? "" : path.basename(document.fileName);

			// 提示用户输入Gist文件名
			const filename = await window.showInputBox({
				title: "Gist 文件名",
				prompt: "请输入 Gist 文件名(需要带文件扩展名)",
				placeHolder: "例如: example.ts",
				value: fileName,
				validateInput(value) {
					// 验证文件名是否为空
					if (isNewlyCreated && value.trim() === "") {
						return "新创建的 Gist 必须指定文件名";
					}
					// 验证文件名是否为空
					if (!path.extname(value)) {
						return "Gist 文件名需要包含扩展名（例如: example.ts）";
					}
					// 防止与 GitHub Gist 自动生成的默认文件名冲突
					const gistFilePattern = /^gistfile\d+(\.\w+)?$/i;
					if (gistFilePattern.test(value.trim())) {
						return "Gist 文件名不能使用 'gistfile+数字' 的形式（例如: gistfile1.ts）";
					}
					return null;
				},
			});
			// 如果用户取消输入，则退出操作
			if (!filename) {
				return;
			}

			// 提示用户输入Gist描述
			const description = await window.showInputBox({
				title: "Gist 描述",
				prompt: "请输入 Gist 描述",
				placeHolder: "请输入 Gist 描述",
				validateInput(value) {
					// 验证描述是否为空
					if (value.trim() === "") {
						return "Gist 描述不能为空";
					}
					return null;
				},
			});
			// 如果用户取消输入，则退出操作
			if (!description) {
				return;
			}

			// 获取配置中设置的默认隐私选项
			const config = workspace.getConfiguration("GistMate");
			const defaultPrivacy = config.get<string>("defaultPrivacy")
				? { value: "N" }
				: { value: "Y" };

			// 定义可见性选项
			const options = [
				{ label: "公开", value: "Y", description: "任何人都可以查看此 Gist" },
				{
					label: "私密",
					value: "N",
					description: "只有你和你分享的人可以查看此 Gist",
				},
			];

			// 提示用户选择Gist的可见性，若用户未选择则使用默认设置
			const isPublic =
				(
					(await window.showQuickPick(options, {
						title: "Gist 的可见性",
						placeHolder: `请选择 Gist 的可见性`,
						ignoreFocusOut: true,
					})) || defaultPrivacy
				).value === "Y";

			// 获取用户的选择区域
			const selection = editor.selection;
			// 获取选中的文本内容，如果没有选中文本则获取整个文档内容
			const content = editor.document.getText(
				selection.isEmpty ? undefined : selection
			);

			octokit.gists.create({
				description,
				public: isPublic,
				files: {
					[filename]: {
						content: content,
					},
				},
			});
		} catch (error) {
			// 记录错误日志
			logger.error(GistCommands.create, error);
		}
	},
] as const;
