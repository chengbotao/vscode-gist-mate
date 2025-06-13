import { OutputChannel } from "vscode";

// 日志级别定义
export type LogLevel = "off" | "error" | "warn" | "info" | "debug";

// 有序级别枚举（用于优先级比较）
enum OrderedLevel {
	off = 0,
	error = 1,
	warn = 2,
	info = 3,
	debug = 4,
}

// 输出渠道提供者接口
interface LogChannelProvider {
	readonly name: string;
	createChannel: (name: string) => OutputChannel;
}

/**
 * VS Code 插件日志工具
 * 支持日志级别控制、双渠道输出、参数格式化
 */
class Logger {
	// 单例模式实现
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
	/** 公共日志处理逻辑 */
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

	/**
	 * 配置日志系统
	 * @param provider 输出渠道提供者
	 * @param logLevel 日志级别
	 * @param debugging 是否开启调试模式
	 */
	configure(
		provider: LogChannelProvider,
		logLevel: LogLevel = this.#logLevel,
		debugging: boolean = this.#isDebugging
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

		// 级别为off时释放资源
		if (value === "off") {
			this.output?.dispose?.();
			this.output = undefined;
		} else {
			this.output ??= this.provider!.createChannel(this.provider!.name);
		}
	}

	/** 显示Output面板 */
	showOutputChannel(preserveFocus?: boolean): void {
		this.output?.show?.(preserveFocus);
	}

	/** 将值转换为可日志化的字符串 */
	private toLoggable(value: unknown): string {
		if (typeof value === "string") return value;
		if (value instanceof Error) return value.message;
		if (typeof value === "object" && value !== null) {
			try {
				return JSON.stringify(value, null, 2);
			} catch {
				return String(value);
			}
		}
		return String(value);
	}

	/** 格式化日志参数 */
	private formatLogParams(params: unknown[]): string {
		if (params.length === 0) return "";
		const serialized = params
			.map((p) => this.toLoggable(p))
			.filter(Boolean)
			.join(", ");
		return serialized ? ` — ${serialized}` : "";
	}

	// 各日志级别的便捷方法
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
		// 特殊处理错误对象
		if (error instanceof Error) {
			params = [error, ...params];
			message = `${message}: ${error.message}`;
		} else if (error !== undefined) {
			params = [error, ...params];
		}
		this.#logWithLevel("error", message, params);
	}
}

// 导出全局日志实例
export const logger = Logger.getInstance();
