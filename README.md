# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Weekly Glimpse

A task management application for tracking weekly tasks and priorities.

## Features

- **Weekly task planning:** Plan tasks for the current week
- **Task prioritization:** Assign priorities to tasks
- **Task completion tracking:** Mark tasks as completed
- **Guest mode:** Use the application without logging in
- **Data synchronization:** Guest tasks are synchronized to the server on login

## Guest Mode

Weekly Glimpse includes a guest mode feature that allows users to use the application without creating an account. Key features:

- Create, edit, and manage tasks without authentication
- Local task storage using IndexedDB
- Visual indicator showing when you're in guest mode
- Automatic data synchronization when logging in
- Task counts and notifications

### How Guest Mode Works

1. **Local Storage:** When not logged in, tasks are stored locally in the browser's IndexedDB database.
2. **Task Creation:** Create tasks as a guest, which are saved locally.
3. **Authentication:** When you log in, local tasks are uploaded to the server.
4. **Synchronization:** Tasks are synced from local storage to your user account.
5. **Cleanup:** After successful sync, local tasks are removed from IndexedDB.

### Implementation Details

Weekly Glimpse guest mode is implemented using:

- **Dexie.js:** For IndexedDB management
- **TaskDataService:** Abstracts data sources (local vs server)
- **SyncService:** Handles data synchronization between local storage and server
- **AuthStore:** Manages authentication state
- **GuestModeIndicator:** UI component showing guest mode status

## Development

### Prerequisites

- Node.js
- pnpm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start the development server:
   ```
   pnpm dev
   ```

## Testing

Weekly Glimpse includes comprehensive tests for guest mode functionality:

### Unit Tests

Run unit tests with:

```
pnpm test
```

Test files include:

- `indexedDB.test.ts`: Tests for the IndexedDB service
- `taskDataService.test.ts`: Tests for the task data abstraction layer
- `syncService.test.ts`: Tests for the data synchronization service
- `authStore.test.ts`: Tests for authentication store
- `GuestModeIndicator.test.ts`: Tests for the guest mode UI indicator

### Integration Tests

- `guestModeWorkflow.test.ts`: Tests the full guest user workflow from task creation to synchronization

### Test Coverage

To generate a test coverage report:

```
pnpm test:coverage
```

## License

MIT
