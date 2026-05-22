# AGENTS.md — Webpaint Portal

## Project Overview

Webpaint Portal is a business management app for managing client websites, tasks, payments, invoices, projects, and client communication.

The project is structured as a multi-app workspace:

- `webpaint-mobile` — Expo React Native mobile app


## Tech Stack

### Web / Backend


### Mobile

- Expo
- React Native
- TypeScript
- Backend : webpaint restfull api with bearer token auth
- Backend API source code: '../soccer-web/src/app/api
- Implement modular design: split large files into meaningfull components, to avoid too much code in a single file and reuse repeating code

### Mobile user interface guidelins

- Implement userfriendly ui, stack nav, responsive layout for tablet and smartphone
- mobile ui alerts: ensure all native alerts, confirms and other system dialogs have a fallback for web

## Main App Purpose

The app should help manage:

- Clients
- Client websites
- Website maintenance tasks
- Project tasks
- Payments
- Invoices
- Subscriptions / retainers
- Notes and communication history
- Website status and service history

## Coding Rules

- Use TypeScript everywhere.
- Prefer clean, readable, modular code.
- Keep shared business logic inside `webpaint-shared`.
- Do not duplicate types between web and mobile.
- Use clear naming for files, functions, and components.
- Keep components small and focused.
- Separate UI logic from business logic.
- Avoid hardcoded values when they should be constants.
- Never commit secrets, API keys, tokens, or `.env` files.

## Folder Responsibilities


### `webpaint-mobile`

Use this for:

- Mobile client/admin interface
- Task tracking
- Client notifications
- Mobile-friendly dashboards
- Quick project/payment overview


Example shared concepts:

- `Client`
- `Website`
- `Task`
- `Invoice`
- `Payment`
- `Project`
- `UserRole`
- `TaskStatus`
- `PaymentStatus`

## Data Model Guidelines

Core entities should include:

- User
- Client
- Website
- Project
- Task
- Invoice
- Payment
- Note

Use status fields where useful, for example:

- `pending`
- `in_progress`
- `completed`
- `cancelled`
- `paid`
- `unpaid`
- `overdue`

## UI Guidelines

- Keep the design clean, modern, and professional.
- Prioritize dashboard usability.
- Important data should be visible quickly.
- Use cards, tables, filters, and status badges.
- Mobile screens should be simple and fast to use.
- Forms should have validation and helpful error messages.

## Security Rules

- Never expose private client data on the frontend unnecessarily.
- Validate all input on the server.
- Protect payment and invoice routes.
- Use role-based permissions where needed.
- Do not store sensitive payment card data directly.
- Keep `.env` out of Git.

## Git Rules

Before committing:

```bash
git status
git add .
git commit -m "Clear commit message"