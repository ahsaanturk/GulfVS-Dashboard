# SupabaseHealthCheck Component - QA & Diagnostic Guide

## Overview

The `SupabaseHealthCheck.tsx` component is a comprehensive diagnostic tool that validates your GulfVS Dashboard's Supabase migration in real-time. It performs 5 critical health checks and displays the results in an intuitive dashboard.

---

## Component Features

### 1. **Environment Audit** ✓
Validates that Supabase credentials are correctly loaded and properly formatted.

**Checks:**
- ✓ SUPABASE_URL exists and contains valid domain
- ✓ SUPABASE_ANON_KEY exists and has correct format
- ✓ URL matches Supabase domain pattern (*.supabase.co)
- ✓ Key starts with valid prefix (sb_ or eyJ)

**Status Indicators:**
- 🟢 **Success**: Both credentials present and valid
- 🟡 **Warning**: Credentials present but format unusual
- 🔴 **Error**: Missing or invalid credentials

---

### 2. **Connectivity Test** ✓
Performs a "ping" to Supabase by fetching one row from each table.

**Tests:**
- ✓ Connects to `companies` table
- ✓ Connects to `logs` table
- ✓ Measures response time
- ✓ Verifies table accessibility

**Status Indicators:**
- 🟢 **Success**: Both tables respond within acceptable time
- 🟡 **Warning**: Connected but RLS might be blocking (401/403)
- 🔴 **Error**: Cannot reach tables or network error

**Response Time Reference:**
- < 100ms: Excellent
- 100-300ms: Good
- > 300ms: Slow (investigate network)

---

### 3. **RLS Validation** ✓
Checks if Row Level Security (RLS) policies are properly configured.

**Detection Logic:**
- ✓ Fetches data with permission checks
- ✓ Detects HTTP 401 (Unauthorized) responses
- ✓ Detects HTTP 403 (Forbidden) responses
- ✓ Identifies which table has RLS issues

**Status Indicators:**
- 🟢 **Success**: RLS properly configured; tables accessible
- 🔴 **Error**: RLS policies missing or too restrictive

**If RLS Error Occurs:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Enable RLS on companies and logs tables
3. Create policies allowing SELECT operations
4. Re-run health check

---

### 4. **Schema Integrity** ✓
Verifies that database tables contain expected fields matching your TypeScript interfaces.

**Validates Companies Table:**
- ✓ Required: id, companyName, emails, createdAt
- ✓ Optional: phoneNumber, tags, location, notes, isInterested

**Validates Logs Table:**
- ✓ Required: id, companyId, emailAddress, emailType, dateSent, completed
- ✓ Optional: note, followUpDate

**Status Indicators:**
- 🟢 **Success**: All required fields present in both tables
- 🟡 **Warning**: Tables empty (no sample data) or partial access
- 🔴 **Error**: Missing required fields; schema mismatch

**If Schema Error Occurs:**
1. Run the SQL DDL provided in SUPABASE_MIGRATION.md
2. Verify table structure in Supabase console
3. Ensure all field types match (UUID, TEXT, BIGINT, etc.)

---

### 5. **State Sync Test** ✓
Verifies that cloud data can be successfully fetched and will update React state.

**Tests:**
- ✓ Fetches up to 5 company records
- ✓ Fetches up to 5 log records
- ✓ Simulates state population
- ✓ Reports record counts

**Status Indicators:**
- 🟢 **Success**: Data retrieved; React state will sync correctly
- 🟡 **Warning**: Tables empty; import sample data first
- 🔴 **Error**: Cannot retrieve data; check connectivity

**If No Data Warning:**
1. Import sample data via ImportExport page
2. Or manually insert test records in Supabase console
3. Re-run health check

---

## Integration Guide

### Step 1: Add to App or Separate Route

**Option A: Debug Page (Recommended)**
```typescript
// pages/HealthCheck.tsx (new file)
import SupabaseHealthCheck from '../components/SupabaseHealthCheck';

export default function HealthCheckPage() {
  return <SupabaseHealthCheck />;
}
```

Then add to routing:
```typescript
import HealthCheckPage from './pages/HealthCheck';

const renderPage = () => {
  switch (currentPage) {
    case 'health-check':
      return <HealthCheckPage />;
    // ... other cases
  }
};
```

**Option B: Embedded in App**
```typescript
import SupabaseHealthCheck from './components/SupabaseHealthCheck';

export default function App() {
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  return (
    <>
      {showHealthCheck && <SupabaseHealthCheck />}
      {/* rest of app */}
    </>
  );
}
```

**Option C: Modal Debug Panel**
```typescript
import SupabaseHealthCheck from './components/SupabaseHealthCheck';

// Add keyboard shortcut (Ctrl+Shift+H) to open health check
```

### Step 2: Import Component
```typescript
import SupabaseHealthCheck from '../components/SupabaseHealthCheck';
```

### Step 3: Use Component
```typescript
function DebugPage() {
  return <SupabaseHealthCheck />;
}
```

---

## Test Scenarios

### Scenario 1: Fresh Installation ✓
**Expected Results:**
- Environment Audit: ✓ Success
- Connectivity Test: ✓ Success
- RLS Validation: ✗ Error (RLS not configured)
- Schema Integrity: ✗ Error (tables not created)
- State Sync: ✗ Error (no access)

**Resolution:**
1. Create Supabase tables (run SQL DDL)
2. Configure RLS policies
3. Re-run health check

---

### Scenario 2: Missing RLS Policies ✓
**Expected Results:**
- Environment Audit: ✓ Success
- Connectivity Test: ⚠ Warning (401/403 detected)
- RLS Validation: ✗ Error
- Schema Integrity: ✓ Success (if tables exist)
- State Sync: ✗ Error

**Resolution:**
1. Enable RLS on companies table
2. Create SELECT policy for authenticated users
3. Enable RLS on logs table
4. Create SELECT policy for authenticated users
5. Re-run health check

**Sample RLS Policy:**
```sql
CREATE POLICY "Enable read access for all users" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON logs
  FOR SELECT USING (true);
```

---

### Scenario 3: Network Issues ✓
**Expected Results:**
- Environment Audit: ✓ Success
- Connectivity Test: ✗ Error (timeout or connection refused)
- RLS Validation: ✗ Error
- Schema Integrity: ✗ Error
- State Sync: ✗ Error

**Resolution:**
1. Check internet connection
2. Verify Supabase project is running (not paused)
3. Check firewall/VPN settings
4. Try from different network
5. Check Supabase status page

---

### Scenario 4: Successful Migration ✓
**Expected Results:**
- Environment Audit: ✓ Success
- Connectivity Test: ✓ Success (< 200ms)
- RLS Validation: ✓ Success
- Schema Integrity: ✓ Success
- State Sync: ✓ Success

**Status:** Ready for production!

---

### Scenario 5: Slow Performance ✓
**Expected Results:**
- Connectivity Test shows > 500ms response time

**Investigation Steps:**
1. Check network latency: `ping xvutrxbfwayyoarcqibz.supabase.co`
2. Verify database query performance
3. Check Supabase logs for slow queries
4. Consider geographic location (distance to server)
5. Check for excessive RLS policies causing overhead

---

## Interpreting Results

### Status Colors & Meanings

| Color | Status | Meaning | Action |
|-------|--------|---------|--------|
| 🟢 Green | Success | ✓ Passed | No action needed |
| 🟡 Yellow | Warning | ⚠ Attention needed | Review details; may still work |
| 🔴 Red | Error | ✗ Failed | Must fix before production |

### Dashboard Summary

**All Green (Success):**
```
✓ Migration Status: Ready
Your Supabase integration is fully configured and operational.
All health checks passed. Ready for production use.
```

**Mixed/Red (Issues):**
```
✗ Migration Status: Issues Detected
Please review the failed checks above and consult the documentation.
```

---

## Troubleshooting Guide

### Issue: "Connectivity Test - Error: 401"
**Cause:** Row Level Security blocking access
**Solution:**
1. Disable RLS temporarily to test
2. Or create public SELECT policies
3. Re-enable with proper policies

### Issue: "Schema Integrity - Missing fields"
**Cause:** Table structure doesn't match TypeScript types
**Solution:**
1. Drop and recreate tables (if dev environment)
2. Manually add missing columns in Supabase UI
3. Verify SQL DDL matches your interface

### Issue: "State Sync - No data"
**Cause:** Tables are empty
**Solution:**
1. Import sample data via app
2. Or manually insert test records:
   ```sql
   INSERT INTO companies (id, companyName, emails, createdAt)
   VALUES (gen_random_uuid(), 'Test Company', ARRAY['test@example.com'], NOW()::bigint * 1000);
   ```

### Issue: "Environment Audit - Warning"
**Cause:** Key format unusual but might still work
**Solution:**
1. Verify credentials work
2. If connectivity test passes, it's fine
3. Otherwise, regenerate API keys from Supabase dashboard

---

## Advanced Usage

### Scheduled Health Checks
```typescript
// Run health checks every 5 minutes in production
useEffect(() => {
  const interval = setInterval(() => {
    // Trigger health check
  }, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### Integration with Monitoring
```typescript
// Send results to external monitoring service
const sendToMonitoring = async (healthResults) => {
  await fetch('/api/health-check', {
    method: 'POST',
    body: JSON.stringify(healthResults)
  });
};
```

### Custom Validation
```typescript
// Extend component with additional checks
const customChecks = [
  // Check for specific data patterns
  // Validate business logic
  // Test performance benchmarks
];
```

---

## Performance Baseline

**Expected Response Times (on good connection):**

| Check | Time | Acceptable |
|-------|------|-----------|
| Environment Audit | < 10ms | Instant |
| Connectivity Test | < 200ms | Good |
| RLS Validation | < 200ms | Good |
| Schema Integrity | < 300ms | OK |
| State Sync | < 300ms | OK |
| **Total** | < 1s | Expected |

---

## Component Properties

The component has no props and is fully self-contained.

```typescript
<SupabaseHealthCheck />
```

**Internal State:**
```typescript
interface HealthCheckResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}
```

---

## Testing Checklist

- [ ] Environment Audit passes
- [ ] Connectivity Test completes within 200ms
- [ ] RLS Validation shows Success
- [ ] Schema Integrity validates both tables
- [ ] State Sync retrieves data
- [ ] All checks show green/success
- [ ] Timestamp updates on re-run
- [ ] Component responsive on mobile
- [ ] No console errors

---

## Database Schema Reference

### Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  companyName TEXT NOT NULL,
  emails TEXT[] NOT NULL,
  phoneNumber TEXT,
  tags TEXT[],
  location TEXT,
  notes TEXT,
  createdAt BIGINT NOT NULL,
  isInterested BOOLEAN DEFAULT false
);
```

### Logs Table
```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY,
  companyId UUID NOT NULL REFERENCES companies(id),
  emailAddress TEXT NOT NULL,
  emailType TEXT NOT NULL,
  dateSent BIGINT NOT NULL,
  note TEXT,
  followUpDate BIGINT,
  completed BOOLEAN DEFAULT false
);
```

---

## FAQ

**Q: Can I use this in production?**
A: Yes, embed it in a restricted admin panel or debug route.

**Q: How often should I run health checks?**
A: Recommend: On app startup, before deployments, and during troubleshooting.

**Q: What if all checks pass but app doesn't work?**
A: Checks validate infrastructure only. Run diagnostic queries to test actual data operations.

**Q: Can I export health check results?**
A: Currently displays in UI. Can extend to export JSON via additional button.

**Q: Does this test CRUD operations?**
A: No, it only tests read access. For write tests, use integration tests or manual QA.

---

## Summary

The `SupabaseHealthCheck` component provides comprehensive validation of your Supabase integration across 5 critical dimensions. Use it as part of your QA process to quickly identify and resolve configuration issues before they impact users.

**Green dashboard = Ready to ship! 🚀**
