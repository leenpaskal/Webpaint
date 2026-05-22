# Webpaint Portal

Webpaint Portal is a modern full-stack business management platform built for managing website clients, projects, tasks, invoices, payments, and ongoing website maintenance.

The platform consists of:

- A Next.js web dashboard and backend system
- An Expo React Native mobile app
- Shared TypeScript packages for reusable business logic and types

## Purpose

Webpaint Portal is designed for agencies, freelancers, and developers who manage multiple client websites and recurring digital services.

The platform helps streamline:

- Client management
- Website management
- Project tracking
- Task management
- Invoicing
- Payment tracking
- Website maintenance workflows
- Service subscriptions and retainers
- Internal notes and communication

## Project Structure

```text
webpaint-web      → Next.js web app + backend/API
webpaint-mobile   → Expo React Native mobile app
webpaint-shared   → Shared types, utilities, schemas, and logic
```

## Tech Stack

### Web

- Next.js
- React
- TypeScript

### Mobile

- Expo
- React Native
- TypeScript

### Shared Workspace

- Shared TypeScript packages
- Shared validation and business logic

## Features

- Client dashboard
- Website/project management
- Task tracking system
- Invoice generation
- Payment management
- Role-based architecture
- Shared business logic between web and mobile
- Scalable monorepo architecture

## Goals

The goal of Webpaint Portal is to provide a scalable internal operating system for managing digital clients, websites, and recurring development work across both desktop and mobile platforms.

## Development

Install dependencies:

```bash
npm install
```

Run web app:

```bash
npm run dev -w webpaint-web
```

Run mobile app:

```bash
npm run dev -w webpaint-mobile
```

## Status

Currently in active development.