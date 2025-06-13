/*
 * @Author: Chengbotao
 * @Description: 日志操作
 * @Contact: https://github.com/chengbotao
 */
import { OutputChannel } from "vscode";

export type LogLevel = "off" | "error" | "warn" | "info" | "debug";

enum OrderedLevel {
	off = 0,
	error = 1,
	warn = 2,
	info = 3,
	debug = 4,
}

interface LogChannelProvider {
	readonly name: string;
	createChannel: (name: string) => OutputChannel;
}

class Logger {
	static #instance: Logger;
	static getInstance() {
		return (Logger.#instance ??= new Logger());
	}
	#logLevel: LogLevel = "off";
	private level: OrderedLevel = OrderedLevel.off;
	private output?: OutputChannel;
	private provider?: LogChannelProvider;
	#isDebugging: boolean = false;
	#appendLine(value: string) {
		this.output?.appendLine(value);
	}
	#logWithLevel(level: LogLevel, message: string, params: unknown[] = []) {
		// 级别对应的数值
		const levelValue = OrderedLevel[level as keyof typeof OrderedLevel];

		// 过滤判断
		if (this.level < levelValue && !this.#isDebugging) {
			return;
		}

		// 控制台输出
		if (this.#isDebugging) {
			console.log(
				`[${this.provider!.name}]`,
				`[${level.toUpperCase()}]`,
				this.timestamp,
				message,
				...params
			);
		}

		// OutputChannel输出
		if (this.level >= levelValue) {
			this.#appendLine(
				`${this.timestamp} [${level}] ${message} ${this.formatLogParams(
					params
				)}`
			);
		}
	}

	private constructor() {}

	configure(
		provider: LogChannelProvider,
		logLevel: LogLevel,
		debugging: boolean = false
	) {
		this.provider = provider;

		this.#isDebugging = debugging;
		this.logLevel = logLevel;
	}
	get isDebugging() {
		return this.#isDebugging;
	}
	get timestamp() {
		return `[${new Date().toISOString().replace(/T/, " ").slice(0, -1)}]`;
	}
	get logLevel() {
		return this.#logLevel;
	}
	set logLevel(value: LogLevel) {
		this.#logLevel = value;
		this.level = OrderedLevel[value as keyof typeof OrderedLevel];
		if (value === "off") {
			this.output?.dispose?.();
			this.output = undefined;
		} else {
			this.output ??= this.provider!.createChannel(this.provider!.name);
		}
	}
	showOutputChannel(preserveFocus?: boolean): void {
		this.output?.show?.(preserveFocus);
	}
	private toLoggable(value: unknown): string {
		if (typeof value === "string") {
			return value;
		}
		if (value instanceof Error) {
			return value.message;
		}
		if (typeof value === "object" && value !== null) {
			try {
				return JSON.stringify(value, null, 2);
			} catch {
				return String(value);
			}
		}
		return String(value);
	}
	private formatLogParams(params: any[]) {
		if (params.length === 0) {
			return "";
		}
		const loggableParams = params.map((p) => this.toLoggable(p)).join(", ");
		return loggableParams.length !== 0 ? ` \u2014 ${loggableParams}` : "";
	}
	debug(message: string, params: unknown[] = []) {
		this.#logWithLevel("debug", message, params);
	}

	log(message: string, params: unknown[] = []) {
		this.#logWithLevel("info", message, params);
	}

	warn(message: string, params: unknown[] = []) {
		this.#logWithLevel("warn", message, params);
	}

	error(message: string, error?: Error | unknown, ...params: unknown[]) {
		// 处理错误对象
		if (error instanceof Error) {
			params = [error, ...params];
			message = `${message}: ${error.message}`;
		} else if (error !== undefined) {
			params = [error, ...params];
		}
		this.#logWithLevel("error", message, params);
	}
}

export const logger = Logger.getInstance();
