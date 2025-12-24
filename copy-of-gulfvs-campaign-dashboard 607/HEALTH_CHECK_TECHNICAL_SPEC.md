# SupabaseHealthCheck.tsx - Technical Specification

## Component Overview

**File:** `src/components/SupabaseHealthCheck.tsx`
**Type:** React Functional Component
**Size:** ~408 lines
**Dependencies:** React, Supabase client, types.ts
**Props:** None (self-contained)
**State:** HealthCheckState object

---

## Architecture

### State Structure

```typescript
interface HealthCheckResult {
  name: string;                           // Display name
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;                        // User-friendly message
  details?: string;                       // Technical details
}

interface HealthCheckState {
  environmentAudit: HealthCheckResult;
  connectivityTest: HealthCheckResult;
  rlsValidation: HealthCheckResult;
  schemaIntegrity: HealthCheckResult;
  stateSyncTest: HealthCheckResult;
  timestamp: string;                      // Last update time
}
```

### Component Lifecycle

```
Component Mount
  ↓
useEffect: runHealthCheck()
  ↓
Execute 5 Checks Sequentially:
  1. checkEnvironment()
  2. checkConnectivity()
  3. checkRLS()
  4. checkSchemaIntegrity()
  5. checkStateSync()
  ↓
Update State for Each Check
  ↓
Render Health Dashboard
  ↓
User Can Click "Run Health Check" to Re-run
```

---

## Detailed Check Implementations

### 1. Environment Audit

**Function:** `checkEnvironment()`
**Purpose:** Validate Supabase credentials

**Logic:**
```typescript
1. Extract SUPABASE_URL and SUPABASE_KEY from supabaseClient.ts
2. Verify both exist (not undefined/empty)
3. Validate URL format:
   - Must contain ".supabase.co"
   - Must be valid URL structure
4. Validate key format:
   - Must start with "sb_" or "eyJ" (base64)
5. Return appropriate status
```

**Status Map:**
| Condition | Status | Code |
|-----------|--------|------|
| Both missing | error | `CREDS_MISSING` |
| Invalid URL format | error | `INVALID_URL` |
| Invalid key format | warning | `UNUSUAL_KEY` |
| All valid | success | `ENV_OK` |

**Response Example (Success):**
```
✓ Success: Environment variables correctly loaded
URL: https://xvutrxbfwayyoarcqibz.supabase.co... | Key: sb_publishable...
```

---

### 2. Connectivity Test

**Function:** `checkConnectivity()`
**Purpose:** Ping Supabase and measure response time

**Query:**
```typescript
// Companies table
supabase
  .from('companies')
  .select('id')
  .limit(1)

// Logs table
supabase
  .from('logs')
  .select('id')
  .limit(1)
```

**Timing:**
```typescript
const startTime = performance.now();
// Query executes here
const endTime = performance.now();
const responseTime = (endTime - startTime).toFixed(2); // milliseconds
```

**Status Map:**
| Condition | Status | Details |
|-----------|--------|---------|
| Both succeed | success | Response time + accessibility status |
| One fails with 401/403 | warning | RLS issue (deferred to next check) |
| Either fails other | error | Network/table not found |
| Exception thrown | error | Network unreachable |

**Response Example (Success):**
```
✓ Success: Successfully connected to Supabase
Response time: 145.23ms | Companies accessible: true | Logs accessible: true
```

---

### 3. RLS Validation

**Function:** `checkRLS()`
**Purpose:** Detect missing Row Level Security policies

**Query:**
```typescript
// Full select (with permission checks)
const { error: companiesError, status: companiesStatus } = 
  await supabase
    .from('companies')
    .select('*')
    .limit(1)

const { error: logsError, status: logsStatus } = 
  await supabase
    .from('logs')
    .select('*')
    .limit(1)
```

**Detection Logic:**
```typescript
if (companiesStatus === 401 || companiesStatus === 403) {
  // RLS issue on companies table
}
if (logsStatus === 401 || logsStatus === 403) {
  // RLS issue on logs table
}
```

**Status Map:**
| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 200 | ✓ OK | RLS configured or disabled |
| 401 | ✗ Unauthorized | RLS policy required |
| 403 | ✗ Forbidden | RLS policy too restrictive |
| 500 | ✗ Server error | Supabase issue |

**Response Example (Error):**
```
✗ Error: Row Level Security policies missing on companies
HTTP 401: Policies need to be configured in Supabase dashboard
```

---

### 4. Schema Integrity

**Function:** `checkSchemaIntegrity()`
**Purpose:** Validate table structure matches TypeScript interfaces

**Companies Validation:**
```typescript
const expectedFields = ['id', 'companyName', 'emails', 'createdAt'];
const optionalFields = ['phoneNumber', 'tags', 'location', 'notes', 'isInterested'];

// Fetch sample row
const { data: companiesData } = await supabase
  .from('companies')
  .select('*')
  .limit(1)

// Check required fields exist
expectedFields.forEach(field => {
  if (!(field in sample)) {
    errors.push(`Missing: ${field}`);
  }
});
```

**Logs Validation:**
```typescript
const expectedFields = ['id', 'companyId', 'emailAddress', 'emailType', 'dateSent', 'completed'];
const optionalFields = ['note', 'followUpDate'];

// Same validation logic as companies
```

**Status Map:**
| Condition | Status | Details |
|-----------|--------|---------|
| All required fields present | success | Schema valid (N fields) |
| Missing required fields | error | Lists missing fields |
| Tables empty | warning | No sample available |
| Query error | warning | Cannot validate |

**Response Example (Success):**
```
✓ Success: All table schemas are valid
✓ Companies schema valid (9 fields) | ✓ Logs schema valid (8 fields)
```

---

### 5. State Sync Test

**Function:** `checkStateSync()`
**Purpose:** Verify cloud data can populate React state

**Query:**
```typescript
// Fetch sample data (up to 5 records each)
const { data: companiesData, error: companiesError } = 
  await supabase
    .from('companies')
    .select('*')
    .limit(5)

const { data: logsData, error: logsError } = 
  await supabase
    .from('logs')
    .select('*')
    .limit(5)
```

**Status Map:**
| Condition | Status | Details |
|-----------|--------|---------|
| Both fetch succeeded with data | success | Record counts + sync ready |
| Both succeeded but empty | warning | No data to test (import sample) |
| Either failed | error | Cannot fetch data |
| Exception thrown | error | Network error |

**Response Example (Success):**
```
✓ Success: Cloud data successfully retrieved
Companies: 12 records | Logs: 47 records | Data will update React state correctly
```

---

## UI Component Structure

### Layout Tree
```
<div> (main container)
  ├── <div> Header Section
  │   ├── <h1> Title
  │   └── <p> Status line with timestamp
  ├── <div> Health Check Cards Grid
  │   ├── Card 1: Environment Audit
  │   ├── Card 2: Connectivity Test
  │   ├── Card 3: RLS Validation
  │   ├── Card 4: Schema Integrity
  │   └── Card 5: State Sync Test
  ├── <div> Action Buttons
  │   └── <button> Run Health Check
  └── <div> Summary Section
      └── Status indicator (green/red)
```

### Card Component Structure
```
Card:
  ├── Status Indicator (32x32 circle)
  │   └── Icon (✓, ⚠, ✗, ○)
  ├── Card Header
  │   ├── Check name
  │   └── Status label
  ├── Card Content
  │   ├── Main message
  │   └── Technical details (monospace)
  └── Border color (based on status)
```

### Color Scheme
```typescript
// Status Colors
success: '#10b981'   // Green
warning: '#f59e0b'   // Amber
error: '#ef4444'     // Red
pending: '#6b7280'   // Gray

// Text Colors
primary: '#111827'   // Near-black
secondary: '#6b7280' // Gray
```

---

## Styling Details

### Inline Styles (No External CSS Required)

**Main Container:**
```typescript
{
  maxWidth: '900px',
  margin: '0 auto',
  padding: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '12px',
  fontFamily: 'system-ui, -apple-system, sans-serif'
}
```

**Card Styling:**
```typescript
{
  backgroundColor: 'white',
  border: `2px solid ${getStatusColor(status)}`,
  borderRadius: '8px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
}
```

**Button Styling:**
```typescript
// Enabled
{
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  cursor: 'pointer'
}

// Disabled
{
  opacity: 0.6,
  cursor: 'not-allowed'
}
```

---

## Error Handling

### Try-Catch Structure
```typescript
try {
  // Perform check
  const result = await someAsyncOperation();
  // Process result
  updateHealthCheck(key, successResult);
} catch (error: any) {
  // Handle error
  updateHealthCheck(key, {
    status: 'error',
    message: 'Check failed',
    details: error?.message || 'Unknown error'
  });
}
```

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Network timeout | Internet down | Caught as error |
| 401/403 status | RLS blocking | Caught as status code |
| Table not found | Schema missing | 404 caught as error |
| Invalid credentials | Auth failed | 401 caught as error |
| Supabase down | Service issue | Connection refused |

---

## Performance Characteristics

### Query Performance
```
Expected Response Times:
├── Environment Audit: ~5ms (local validation)
├── Connectivity Test: ~100-300ms (network)
├── RLS Validation: ~100-300ms (network + permission check)
├── Schema Integrity: ~200-400ms (fetch + validation)
└── State Sync Test: ~200-400ms (fetch sample data)

Total Expected: < 1.5 seconds
```

### Resource Usage
```
Memory:
├── Component state: ~2KB
├── Fetched data: ~10-50KB (5 companies + 5 logs)
└── Total: ~100KB max

Network:
├── 2 connectivity pings
├── 2 RLS validation queries
├── 2 schema validation fetches
├── 2 state sync fetches
└── Total: 8 requests (~10-20KB payload)
```

---

## Testing Scenarios

### Unit Test Examples

```typescript
describe('SupabaseHealthCheck', () => {
  it('should run all 5 checks on mount', async () => {
    // Expect all checks to execute
  });

  it('should display green for successful checks', () => {
    // Expect success status to show green color
  });

  it('should detect RLS errors as 401/403', async () => {
    // Mock Supabase to return 403
    // Expect RLS check to show error
  });

  it('should handle network errors gracefully', async () => {
    // Mock network failure
    // Expect error status with helpful message
  });

  it('should update timestamp on re-run', async () => {
    // Run health check twice
    // Expect timestamp to update
  });
});
```

---

## API Reference

### Public Interface
```typescript
<SupabaseHealthCheck />
// No props, no state exposure, self-contained
```

### Internal Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `runHealthCheck()` | Execute all 5 checks | void |
| `checkEnvironment()` | Validate credentials | void |
| `checkConnectivity()` | Ping tables | void |
| `checkRLS()` | Check policies | void |
| `checkSchemaIntegrity()` | Validate fields | void |
| `checkStateSync()` | Fetch data | void |
| `updateHealthCheck()` | Update state | void |
| `getStatusColor()` | Map status to color | string |
| `getStatusIcon()` | Map status to icon | string |

---

## Extensibility

### Adding Custom Checks

```typescript
// Add new check function
const checkCustom = async () => {
  try {
    // Your validation logic
    updateHealthCheck('customCheck', {
      name: 'Custom Check',
      status: 'success',
      message: 'Custom validation passed'
    });
  } catch (error) {
    updateHealthCheck('customCheck', {
      status: 'error',
      message: 'Custom validation failed'
    });
  }
};

// Add to state
interface HealthCheckState {
  // ... existing checks
  customCheck: HealthCheckResult;
}

// Call in runHealthCheck()
await checkCustom();
```

### Custom Styling

Modify color scheme:
```typescript
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success': return '#YOUR_GREEN';
    case 'warning': return '#YOUR_YELLOW';
    // ...
  }
};
```

---

## Deployment Checklist

- [ ] Component file created: `SupabaseHealthCheck.tsx`
- [ ] All 5 check functions implemented
- [ ] Proper error handling with try-catch
- [ ] Status indicators (colors/icons) correct
- [ ] Component responsive on mobile
- [ ] No external dependencies beyond React + Supabase
- [ ] Accessibility considerations (color not only indicator)
- [ ] Performance acceptable (< 2 seconds total)
- [ ] Documentation complete

---

## Summary

**Component:** SupabaseHealthCheck.tsx
**Type:** Production-ready React diagnostic component
**Tests:** 5 comprehensive Supabase migration validations
**Status:** ✅ Complete and documented
**Ready:** Yes, ready to integrate into app
