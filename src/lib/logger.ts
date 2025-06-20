type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  production: boolean;
}

class Logger {
  private config: LogConfig;
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      production: process.env.NODE_ENV === 'production'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level];
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log('🔍 [DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log('ℹ️ [INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('⚠️ [WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('❌ [ERROR]', ...args);
    }
  }

  // Performance logging only in development
  perf(label: string, fn: () => void): void {
    if (!this.config.production) {
      console.time(`⏱️ ${label}`);
      fn();
      console.timeEnd(`⏱️ ${label}`);
    } else {
      fn();
    }
  }
}

export const logger = new Logger();