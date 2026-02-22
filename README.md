# coge

AI-powered command generator. Describe what you want — get a shell command back.

**Free to use** with reasonable daily consumption — all supported providers offer free API tiers. Just grab the API keys and go. Provider list based on [free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources).

Supports multiple LLM providers. When multiple API keys are configured, **races them in parallel** and returns the fastest response.

## Quick Start

1. Install globally:

```bash
npm install -g cogeai
```

2. Set at least one provider API key:

```bash
export COGE_GEMINI_API_KEY="your-key"
```

3. Run:

```bash
coge "find all TODO comments in javascript files"
```

4. Press **Enter** to execute, **c** to copy, **Esc** to cancel.

## Usage

```
coge <prompt>                  Generate a shell command from description
coge --configure | -c          Configure provider and model
coge --pull models <provider>  Fetch available models for a provider

Options:
  --non-interactive              Print command and exit (for pipelines)
  --debug                        Show config, provider, and timing info
  --help, -h                     Show this help message
```

### Examples

```bash
# Generate and execute a command
coge "list files larger than 100MB"

# Use in a pipeline
coge --non-interactive "compress all pngs in current dir" | bash

# See which provider won the race
coge --debug "disk usage by directory"
```

## Race Mode

When multiple providers have API keys configured, coge automatically races them in parallel:

- **>3 providers** configured — races 3 random ones (always including your default)
- **2-3 providers** configured — races all of them
- **1 provider** configured — uses it directly, no race

This is the default behavior — no extra flags needed.

## Providers

| Provider | Environment Variable |
|---|---|
| gemini | `COGE_GEMINI_API_KEY` |
| openai | `COGE_OPENAI_API_KEY` |
| openrouter | `COGE_OPENROUTER_API_KEY` |
| groq | `COGE_GROQ_API_KEY` |
| cerebras | `COGE_CEREBRAS_API_KEY` |
| mistral | `COGE_MISTRAL_API_KEY` |
| codestral | `COGE_CODESTRAL_API_KEY` |
| cohere | `COGE_COHERE_API_KEY` |
| cloudflare | `COGE_CLOUDFLARE_API_KEY` |
| github-models | `COGE_GITHUB_MODELS_TOKEN` |
| huggingface | `COGE_HUGGINGFACE_API_KEY` |
| vercel-ai | `COGE_VERCEL_API_KEY` |
| ollama | _(no key needed — local)_ |

Set the env vars for any providers you want to use. The more you set, the faster the race.

## Configuration

Config file location: `~/.config/coge/config.json` (or `$XDG_CONFIG_HOME/coge/config.json`).

Created automatically on first run. Edit manually or use:

```bash
coge --configure
```

### Config structure

```json
{
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "providers": {
    "gemini": {
      "default": "gemini-2.5-flash",
      "available": ["gemini-2.5-flash", "gemini-2.5-pro"]
    }
  }
}
```

### Updating available models

Fetch the latest model list from a provider's API:

```bash
coge --pull models gemini
```

## License

ISC
