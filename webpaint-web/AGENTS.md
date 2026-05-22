# AGENTS.md — Webpaint Portal

## Project Overview

Webpaint Portal is a business management app for managing client websites, tasks, payments, invoices, projects, and client communication.

The project is structured as a multi-app workspace:

- `webpaint-web` — Next.js web app and backend/API layer

## Tech Stack

### Web / Backend

- Next.js
- React
- TypeScript
- API routes / server actions
- Tailwind CSS
- Neon DB
- Drizzle ORM

### Mobile

- Expo
- React Native
- TypeScript

### Shared

- Shared TypeScript types
- Shared validation logic
- Shared utility functions
- Shared business rules

### Arcitectural Guidelines
- **Service Layer** - implement app business logic used by the restfull api and server actions
- Use **modular design**: split the app into self contained components to avoid long complex files with too much code,
 auth: JWT tokens + bycript, 
 database: neon db + drizzle orm

## User interface guidelines

-Implement modern ui, responsive design, use server-rendered components in Next.js and APP router

-Use server side rendering only use clinet components for browser interaction

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

### `webpaint-web`

Use this for:

- Dashboard web interface
- Admin/client portal
- Backend API routes
- Authentication logic
- Database calls
- Invoice/payment backend logic
- Server-side validation

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