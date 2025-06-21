/*
 * @Author: Chengbotao
 * @Description:
 * @Contact: https://github.com/chengbotao
 */
import * as gist from "./gist";
import * as profiles from "./profiles";

export const supportedCommands = [...Object.values(gist), ...Object.values(profiles)];
