type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export class Logger {
  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  public static info(message: string, meta?: any): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  public static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  public static error(message: string, error?: any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }
      : error;
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  public static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

export default Logger;
