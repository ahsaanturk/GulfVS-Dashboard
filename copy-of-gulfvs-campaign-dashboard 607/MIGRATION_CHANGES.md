# Quick Reference: Supabase Migration Changes

## Files Modified

### 1. Created: `src/supabaseClient.ts`
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = 'https://xvutrxbfwayyoarcqibz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XSD0GMDOhuyb-ysFsDbK5g_gdko4z58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

### 2. Updated: `src/db.ts`
**Key Changes:**
- Constructor no longer calls `init()` 
- All methods remain async with identical signatures
- `init()` method added for manual initialization
- `save()` method now syncs to both localStorage AND Supabase
- `bulkAddCompanies()` checks Supabase for duplicates before inserting
- All `save()` calls are now `await this.save()`

**Before:**
```typescript
constructor() {
  this.init();
}

private async init() { ... }
private save() { ... }
async bulkAddCompanies(...) { 
  ...
  this.save();
}
```

**After:**
```typescript
constructor() {
  // Don't call init here; it will be called manually in App.tsx
}

async init(): Promise<void> {
  // Prevent multiple concurrent initializations
  if (this.initPromise) return this.initPromise;
  
  this.initPromise = this._performInit();
  return this.initPromise;
}

private async _performInit(): Promise<void> {
  try {
    // Try Supabase first
    const [companiesRes, logsRes] = await Promise.all([
      supabase.from('companies').select('*').order('createdAt', { ascending: false }),
      supabase.from('logs').select('*').order('dateSent', { ascending: false })
    ]);

    if (!companiesRes.error && !logsRes.error) {
      this.companies = companiesRes.data || [];
      this.logs = logsRes.data || [];
      this.isSupabaseAvailable = true;
      localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
      return;
    }
  } catch (e) {
    console.warn('Supabase unavailable, falling back to localStorage', e);
  }

  // Fallback to localStorage...
  // Fallback to data.json...
}

private async save(): Promise<void> {
  // Always save to localStorage
  localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(this.companies));
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
  localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');

  // Try to sync with Supabase if available
  if (this.isSupabaseAvailable) {
    try {
      await Promise.all([
        supabase.from('companies').upsert(this.companies, { onConflict: 'id' }),
        supabase.from('logs').upsert(this.logs, { onConflict: 'id' })
      ]);
    } catch (e) {
      console.warn('Failed to sync with Supabase:', e);
    }
  }
}

async bulkAddCompanies(newItems: Omit<Company, 'id' | 'createdAt'>[]): Promise<{ added: number; skipped: number }> {
  // ... existing dedup logic ...

  // NEW: Check Supabase for duplicates if available (smart merging)
  if (this.isSupabaseAvailable) {
    try {
      const { data: supabaseCompanies, error } = await supabase
        .from('companies')
        .select('companyName, emails');
      
      if (!error && supabaseCompanies) {
        supabaseCompanies.forEach(c => {
          existingNames.add(c.companyName.toLowerCase().trim());
          (c.emails || []).forEach((e: string) => existingEmails.add(e.toLowerCase().trim()));
        });
      }
    } catch (e) {
      console.warn('Could not check Supabase for duplicates, continuing with local check', e);
    }
  }

  // ... rest of logic unchanged ...

  if (addedCount > 0) await this.save();  // CHANGED: await this.save()
  return { added: addedCount, skipped: skippedCount };
}
```

### 3. Updated: `src/App.tsx`
**Key Change:**
```typescript
// BEFORE
const refreshData = async () => {
  const c = await db.getCompanies();
  const l = await db.getLogs();
  setCompanies(c);
  setLogs(l);
};

// AFTER
const refreshData = async () => {
  await db.init();  // NEW: Initialize Supabase sync
  const c = await db.getCompanies();
  const l = await db.getLogs();
  setCompanies(c);
  setLogs(l);
};
```

## Import/Export: NO CHANGES
- `ImportExportPage.tsx` works identically
- File handling logic unchanged
- JSON structure exported remains identical
- Deduplication during import enhanced with Supabase checking

## Unchanged Components
✅ All UI components
✅ All Tailwind classes
✅ All styling/themes
✅ Sidebar and profile switching
✅ All modals and confirmations
✅ All business logic in pages
✅ All utilities and constants

## Return Type Compatibility

All method signatures remain **100% identical**:

| Method | Signature | Returns |
|--------|-----------|---------|
| `getCompanies()` | `async` | `Promise<Company[]>` |
| `addCompany(company)` | `async` | `Promise<Company>` |
| `bulkAddCompanies(items)` | `async` | `Promise<{added: number; skipped: number}>` |
| `updateCompany(id, updates)` | `async` | `Promise<void>` |
| `deleteCompany(id)` | `async` | `Promise<void>` |
| `getLogs()` | `async` | `Promise<EmailLog[]>` |
| `addLog(log)` | `async` | `Promise<EmailLog>` |
| `updateLog(id, updates)` | `async` | `Promise<void>` |
| `deleteLog(id)` | `async` | `Promise<void>` |
| `hasReceivedFirstTime(email)` | `async` | `Promise<boolean>` |
| `importProjectData(data)` | `async` | `Promise<void>` |
| `downloadProjectJSON()` | sync | `void` |
| `exportToCSV(data, filename)` | sync | `void` |

## Deployment Checklist

- [ ] Run `npm install` (if using via npm instead of ESM)
- [ ] Create Supabase tables (SQL provided in SUPABASE_MIGRATION.md)
- [ ] Test app locally
- [ ] Verify localStorage fallback works
- [ ] Test import/export functionality
- [ ] Deploy to production

## Support

For issues or questions:
1. Check browser console for warning messages
2. Verify Supabase tables exist and have correct schema
3. Check localStorage is enabled in browser
4. Test offline mode (DevTools Network → Offline)
5. Verify Supabase credentials in supabaseClient.ts
