#!/usr/bin/env node

/**
 * Standalone MCP Server for GeminiAutoPM
 *
 * This entry point allows running GeminiAutoPM servers without the Gemini CLI wrapper.
 * Supports running individual servers or all servers simultaneously.
 */

import { Command } from 'commander';
import { PMServer } from './servers/pm-server.js';
import { AgentsServer } from './servers/agents-server.js';
import { Logger, LogLevel } from './utils/logger.js';

const program = new Command();

program
  .name('gemini-autopm')
  .description('AI-powered Project Management MCP Server')
  .version('1.0.0')
  .option('--log-level <level>', 'Set log level (debug, info, warn, error)', 'info')
  .option('--enable-context7', 'Enable Context7 documentation integration', true);

program
  .command('pm')
  .description('Start Project Management server')
  .option('--port <port>', 'Port for HTTP transport (if enabled)', '8080')
  .action(async (options: any, cmd: any) => {
    const globalOptions = cmd.parent.opts();
    console.log('CLI: Starting PM server command...');

    const logger = new Logger({
      name: 'AutoPM-PM',
      level: globalOptions.logLevel as LogLevel,
    });

    try {
      console.log('CLI: Created logger');
      logger.info('Starting Project Management MCP Server...');

      console.log('CLI: Creating PMServer...');
      const server = new PMServer({
        name: 'autopm-pm',
        version: '1.0.0',
        logLevel: globalOptions.logLevel as LogLevel,
        enableContext7: globalOptions.enableContext7,
      });
      console.log('CLI: PMServer created successfully');

      await server.start();
      logger.info('Project Management server started successfully');
      } catch (error: unknown) {
        logger.error('Failed to start PM server:', error as Error);
        process.exit(1);
      }
  });

program
  .command('agents')
  .description('Start Agents server')
  .option('--port <port>', 'Port for HTTP transport (if enabled)', '8081')
  .action(async (options: any, cmd: any) => {
    const globalOptions = cmd.parent.opts();

    const logger = new Logger({
      name: 'AutoPM-Agents',
      level: globalOptions.logLevel as LogLevel,
    });

    try {
      logger.info('Starting Agents MCP Server...');

      const server = new AgentsServer({
        name: 'autopm-agents',
        version: '1.0.0',
        logLevel: globalOptions.logLevel as LogLevel,
        enableContext7: globalOptions.enableContext7,
      });

      await server.start();
      logger.info('Agents server started successfully');
      } catch (error: unknown) {
        logger.error('Failed to start Agents server:', error as Error);
        process.exit(1);
      }
  });

program
  .command('all')
  .description('Start both PM and Agents servers')
  .option('--pm-port <port>', 'Port for PM server HTTP transport', '8080')
  .option('--agents-port <port>', 'Port for Agents server HTTP transport', '8081')
  .action(async (options: any, cmd: any) => {
    const globalOptions = cmd.parent.opts();

    const logger = new Logger({
      name: 'AutoPM-All',
      level: globalOptions.logLevel as LogLevel,
    });

    logger.info('Starting both PM and Agents MCP servers...');

    // Note: MCP stdio transport typically only supports one server per process
    // For now, start the PM server as the primary one
    try {
      const pmServer = new PMServer({
        name: 'autopm-pm',
        version: '1.0.0',
        logLevel: globalOptions.logLevel as LogLevel,
        enableContext7: globalOptions.enableContext7,
      });
      await pmServer.start();
      logger.info('PM server started successfully (Agents tools available within PM server)');
    } catch (error: unknown) {
      logger.error('Failed to start servers:', error as Error);
      process.exit(1);
    }
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

program.parse();