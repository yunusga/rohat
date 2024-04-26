#!/usr/bin/env node

const {
	name,
	version,
	description,
} = require('../package.json');

const { program } = require('commander');

const { log } = console;

// Setup additional HELP information
program
	.name(name)
	.version(version, '-v, --version')
	.description(description)
	.on('--help', () => {
		log(`\nCommands help:\n  ${name} [command] --help`);
		log(`\nVersion:\n  ${version}`);
		log(`Executable:\n  ${__filename}`);
	});

// Initialize new project
program
	.command('init [directory]')
	.description('Initialize new project')
	.action((directory) => {
		require('../commands/init')(directory);
	});

// Start dev server
program
	.command('dev')
	.description('Start development server')
	.option('-b, --build', 'Build project without server, prepare for release build', false)
	.action((options) => {
		require('../commands/dev')(options);
	});

// Create block
program
	.command('cb <blockName>')
	.description('Create new block')
	.option('-t, --techs [njk,styl,js]', 'Files extensions for new block')
	.action((blockName, options) => {
		require('../commands/cb')(blockName, options.techs);
	});

// Parse CLI arguments
program.parse(process.argv);

// If no args shutdown and show help information
if (!process.argv.slice(2).length) {
	program.help();
}
