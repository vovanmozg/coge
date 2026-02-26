# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-02-26

### Fixed

- Add error handling for unconfigured providers
- Improve error messages when API keys are missing

### Changed

- Change file permissions for publish script (non-executable)

### Added

- Implement a tool for quick tips in the terminal

## [1.0.0] - 2025-02-22

### Added

- Initial release
- AI-powered command generation from natural language descriptions
- Support for multiple LLM providers (Gemini, OpenRouter, Cerebras, Mistral, Codestral, Cohere, Cloudflare, GitHub Models, Hugging Face, Vercel AI, Ollama)
- Race mode: when multiple providers are configured, races them in parallel and returns the fastest response
- Interactive mode: press Enter to execute, `c` to copy, Esc to cancel
- Non-interactive mode for pipelines (`--non-interactive`)
- Configuration via `~/.config/coge/config.json` or `coge --configure`
- `coge --pull models <provider>` to fetch available models from a provider
- Debug mode (`--debug`) to show config, provider, and timing info

