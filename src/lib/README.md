# Weekly Glimpse - Library Structure

This directory contains the core components, utilities, and business logic for the Weekly Glimpse application.

## Directory Structure

```
lib/
├── components/ - UI components organized by domain
│   ├── calendar/ - Calendar-related components
│   │   ├── CalendarHeader.svelte
│   │   ├── WeeklyCalendar.svelte
│   │   └── tests/ - Component-specific tests
│   ├── common/ - Shared UI components
│   │   ├── ErrorBoundary.svelte
│   │   ├── GuestModeIndicator.svelte
│   │   └── tests/ - Component-specific tests
│   └── tasks/ - Task management components
│       ├── TaskItem.svelte
│       ├── TaskModal.svelte
│       ├── TaskColorPicker.svelte
│       ├── TaskPriority.svelte
│       └── tests/ - Component-specific tests
├── constants/ - Application constants organized by domain
│   ├── app.ts - App-wide settings
│   ├── dates.ts - Date format configurations
│   ├── features.ts - Feature flags
│   ├── tasks.ts - Task-related constants
│   └── theme.ts - Theme and styling constants
├── client/ - Client-side API integrations
│   ├── api.ts - API request utilities
│   └── tests/ - Client API tests
├── services/ - Client-side services
│   ├── cache.ts - Caching service
│   ├── indexedDB.ts - IndexedDB utilities
│   ├── syncService.ts - Data synchronization
│   ├── taskService.ts - Task manipulation
│   ├── taskDataService.ts - Task data handling
│   └── tests/ - Service-specific tests
├── server/ - Server-side code
│   ├── api/ - API endpoints
│   ├── auth/ - Authentication logic
│   ├── db/ - Database access and models
│   └── services/ - Backend services
├── stores/ - Svelte stores for state management
│   ├── authStore.ts - Authentication state
│   ├── filterStore.ts - Filter preferences
│   ├── filteredTasks.ts - Filtered task data
│   ├── taskStore.ts - Task data store
│   └── tests/ - Store-specific tests
├── tests/ - Common test utilities
│   ├── integration/ - Integration tests
│   ├── mocks/ - Test mocks
│   └── testUtils.ts - Testing helpers
├── types/ - TypeScript type definitions
│   ├── socket.ts - Socket.io types
│   └── task.ts - Task-related types
└── utils/ - Utility functions
    └── date.ts - Date formatting utilities
```

## Usage

Components, utilities, and types are exported through the main `index.ts` file. Import them using the `$lib` alias:

```typescript
// Import components
import { TaskModal, WeeklyCalendar } from '$lib';

// Import constants
import { DATE_FORMATS, THEME_COLORS } from '$lib';

// Import utility functions
import { formatDate } from '$lib';
```

## Adding New Components

When adding new components, follow these patterns:

1. Add domain-specific components to their respective directories
2. Place component tests in the component's `tests/` directory
3. Export the component through the directory's `index.ts` barrel file
4. Make sure the component is re-exported through the main `index.ts` if needed

## Type Organization

- Library-specific types go in `lib/types/`
- Application-wide types go in the root `types/` directory
- Re-export types that should be available through the `$lib` alias
