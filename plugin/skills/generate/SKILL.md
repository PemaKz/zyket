---
name: generate
description: Generate Zyket framework components — handlers, guards, routes, middlewares, services, events, schedulers, workers, and extensions. Use when the user wants to create or scaffold any Zyket component.
allowed-tools: Read, Write, Grep, Glob, Bash
argument-hint: [component-type] [name]
---

# Zyket Component Generator

Generate a **$ARGUMENTS** component for the Zyket framework.

## Instructions

1. Parse `$ARGUMENTS` — first word is the component type, remaining words form the name.
2. Read the matching component reference from [components/](components/) to get the exact pattern.
3. Read the [rules.md](rules.md) file for conventions that apply to all components.
4. Before writing, read the actual base class from the project's `node_modules/zyket/` or framework source to confirm the API hasn't changed.
5. Create the target directory if it doesn't exist.
6. Write the component file following the reference pattern exactly.

## Component Types

| Type | Reference | Location |
|------|-----------|----------|
| `handler` | [components/handler.md](components/handler.md) | `src/handlers/<name>.js` |
| `guard` | [components/guard.md](components/guard.md) | `src/guards/<name>.js` |
| `route` | [components/route.md](components/route.md) | `src/routes/<path>.js` |
| `middleware` | [components/middleware.md](components/middleware.md) | `src/middlewares/<name>.js` |
| `service` | [components/service.md](components/service.md) | Custom location |
| `event` | [components/event.md](components/event.md) | `src/events/<name>.js` |
| `scheduler` | [components/scheduler.md](components/scheduler.md) | `src/schedulers/<name>.js` |
| `worker` | [components/worker.md](components/worker.md) | `src/workers/<name>.js` |
| `extension` | [components/extension.md](components/extension.md) | Custom location |
