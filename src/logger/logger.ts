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
	private toLoggableParams(params: any[]) {
		if (params.length === 0) {
			return "";
		}
		const loggableParams = params.map((p) => this.toLoggable(p)).join(", ");
		return loggableParams.length !== 0 ? ` \u2014 ${loggableParams}` : "";
	}
	debug(message: string, params: unknown[] = []) {
		if (this.level < OrderedLevel.debug && !this.#isDebugging) {
			return;
		}

		// 调试模式输出到控制台
		if (this.#isDebugging) {
			console.log(
				`[${this.provider!.name}]`,
                "[DEBUG]",
				this.timestamp,
				message,
				...params
			);
		}
		// 仅当级别足够时输出到output面板
		if (this.level >= OrderedLevel.debug) {
			this.#appendLine(
				`${this.timestamp} [DEBUG] ${message} ${this.toLoggableParams(params)}`
			);
		}
	}

	log(message: string, params: unknown[] = []) {
		if (this.level < OrderedLevel.info && !this.#isDebugging) {
			return;
		}

		// 调试模式输出到控制台
		if (this.#isDebugging) {
			console.log(
				`[${this.provider!.name}]`,
                "[INFO]",
				this.timestamp,
				message,
				...params
			);
		}
		// 仅当级别足够时输出到output面板
		if (this.level >= OrderedLevel.info) {
			this.#appendLine(
				`${this.timestamp} [INFO] ${message} ${this.toLoggableParams(params)}`
			);
		}
	}

	warn(message: string, params: unknown[] = []) {
		if (this.level < OrderedLevel.warn && !this.#isDebugging) {
			return;
		}

		// 调试模式输出到控制台
		if (this.#isDebugging) {
			console.log(
				`[${this.provider!.name}]`,
                "[WARN]",
				this.timestamp,
				message,
				...params
			);
		}
		// 仅当级别足够时输出到output面板
		if (this.level >= OrderedLevel.warn) {
			this.#appendLine(
				`${this.timestamp} [WARN] ${message} ${this.toLoggableParams(params)}`
			);
		}
	}

	error(message: string, params: unknown[] = []) {
		if (this.level < OrderedLevel.error && !this.#isDebugging) {
			return;
		}

		// 调试模式输出到控制台
		if (this.#isDebugging) {
			console.log(
				`[${this.provider!.name}]`,
				this.timestamp,
                "[ERROR]",
				message,
				...params
			);
		}
		// 仅当级别足够时输出到output面板
		if (this.level >= OrderedLevel.error) {
			this.#appendLine(
				`${this.timestamp} [ERROR] ${message} ${this.toLoggableParams(params)}`
			);
		}
	}
}

export const logger = Logger.getInstance();
