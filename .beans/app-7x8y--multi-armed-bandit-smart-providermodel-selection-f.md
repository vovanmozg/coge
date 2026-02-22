---
# app-7x8y
title: 'Multi-Armed Bandit: smart provider:model selection for race mode'
status: in-progress
type: feature
priority: normal
created_at: 2026-02-22T20:51:09Z
updated_at: 2026-02-22T21:23:44Z
blocked_by:
    - app-l7fk
---

## Goal

Реализовать Multi-Armed Bandit (ε-greedy) для автоматического выбора самых быстрых и надёжных пар provider:model при race mode.

## Концепция

Каждая пара `provider:model` (например `openai:gpt-4o`, `anthropic:claude-sonnet-4-20250514`) — отдельная "рука" бандита. Система учится какие пары быстрее и надёжнее, периодически пробует другие чтобы не застрять на устаревших данных.

## Хранение данных

Файл `~/.coge/bandit.json`:

```json
{
  "openai:gpt-4o": {
    "n": 42,
    "avg_latency": 1200,
    "success_rate": 0.95,
    "reward": 0.78,
    "last_used": "2026-02-20T..."
  },
  "anthropic:claude-sonnet-4-20250514": {
    "n": 38,
    "avg_latency": 900,
    "success_rate": 0.99,
    "reward": 0.91,
    "last_used": "2026-02-22T..."
  }
}
```

- **n** — количество использований
- **avg_latency** — среднее время ответа (мс), инкрементальное обновление
- **success_rate** — доля успешных запросов
- **reward** — комбинированная оценка
- **last_used** — для decay старых данных

## Формула reward

```
reward = success_rate * (1 / normalize(avg_latency))
```

`normalize` приводит латентность к 0..1 относительно самого быстрого и самого медленного из известных.

## Алгоритм выбора (ε-greedy, N=3 для race mode)

```
ε = 0.1  (10% exploration)

Слот 1: лучшая пара по reward (exploitation)
Слот 2: случайная пара из оставшихся (exploration)
Слот 3: случайная пара из оставшихся (exploration)
```

Т.е. 1 лучший по reward + 2 случайных.

## Обновление после запроса

```
n += 1
avg_latency = avg_latency + (actual_latency - avg_latency) / n
success_rate = success_rate + (success - success_rate) / n
пересчитать reward
обновить last_used
```

Инкрементальное обновление среднего — не нужно хранить историю.

## Холодный старт

- Новая пара (n = 0): reward = 0.5 (оптимистичная оценка для стимуляции exploration)
- Пары с n < 3 получают бонус к reward
- Первые запуски (всё пустое): round-robin

## Decay (устаревание)

Если пара не использовалась > 7 дней — reward постепенно сдвигается к 0.5. Провайдеры меняют инфраструктуру, старые замеры теряют актуальность.

## Конфигуратор: выбор стратегии

Конфигуратор предлагает пользователю выбрать стратегию:

```
? Choose mode:
  ❯ Auto (system picks the fastest provider:model)
    Manual (choose provider and model yourself)
```

- **Auto** → bandit выбирает пару автоматически, используется в race mode
- **Manual** → текущий флоу: выбор провайдера → выбор модели → фиксированная пара

В конфиге это выглядит как:
```json
{ "strategy": "auto" }
// или
{ "strategy": "manual", "provider": "openai", "model": "gpt-4o" }
```

## Пример сценария

1. Пользователь запускает `coge` со стратегией auto + race mode (N=3)
2. Система смотрит в bandit.json, видит 8 пар
3. ε-greedy: 1 лучший по reward + 2 случайных
4. Отправляет запрос на все 3 параллельно
5. Первый ответ — пользователю
6. Обновляет статистику для всех 3

## TODO

- [ ] Реализовать хранилище bandit.json
- [ ] Реализовать формулу reward и инкрементальное обновление
- [ ] Реализовать ε-greedy выбор (1 exploit + 2 explore)
- [ ] Добавить decay для устаревших данных
- [ ] Обработать холодный старт
- [ ] Добавить выбор стратегии (auto/manual) в конфигуратор
- [ ] Интегрировать с race mode (app-l7fk)
