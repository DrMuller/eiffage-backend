export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

// Get log level from environment or default to INFO
const LOG_LEVEL = process.env.LOG_LEVEL || LogLevel.INFO;

// Map log levels to numeric values for comparison
const logLevelValues = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

// Current log level value
const currentLogLevelValue =
  logLevelValues[LOG_LEVEL as LogLevel] || logLevelValues[LogLevel.INFO];

const logger = {
  error: (message: string, meta?: any): void => {
    if (logLevelValues[LogLevel.ERROR] <= currentLogLevelValue) {
      console.error(
        `[${LogLevel.ERROR}] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  },

  warn: (message: string, meta?: any): void => {
    if (logLevelValues[LogLevel.WARN] <= currentLogLevelValue) {
      console.warn(
        `[${LogLevel.WARN}] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  },

  info: (message: string, meta?: any): void => {
    if (logLevelValues[LogLevel.INFO] <= currentLogLevelValue) {
      console.info(
        `[${LogLevel.INFO}] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  },

  debug: (message: string, meta?: any): void => {
    if (logLevelValues[LogLevel.DEBUG] <= currentLogLevelValue) {
      console.debug(
        `[${LogLevel.DEBUG}] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  },
};

export default logger;
