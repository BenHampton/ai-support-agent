/// <reference types="@testing-library/jest-dom/vitest" />
// runtime matchers (generic entry extends the global expect vitest uses); the reference above pulls in the
// /vitest type augmentation so matchers typecheck against vitest's Assertion. RTL auto-cleanup via globals.
import '@testing-library/jest-dom'
