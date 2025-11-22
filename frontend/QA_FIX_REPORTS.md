# QA Checklist: Reports Auto-Save & Dashboard Live-Sync

## Prerequisites

1. **Start Backend**
   ```bash
   cd backend
   python app.py
   ```
   Verify API is running at `http://localhost:5000`

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   Verify UI is running at `http://localhost:3000`

3. **Login**
   - Navigate to `/login` or `/signup`
   - Use a test Firebase account
   - Verify you're logged in (check Navbar for user avatar)

## Test 1: Auto-Save After Tool Run

### Steps:
1. Open **Tab A**: Navigate to `/reports` (Dashboard/Reports page)
2. Open **Tab B**: Navigate to any tool page (e.g., `/tools/ipinfo`)
3. In **Tab B**, open browser DevTools Console (F12)
4. In **Tab B**, enter a test value (e.g., IP: `8.8.8.8`) and click "Run Scan"
5. **Watch Console in Tab B** for:
   - `[ToolTemplate] Auto-saving report after scan...`
   - `[ReportContext] saveReport called`
   - `[ReportContext] Saving report to Firestore...`
   - `[ReportContext] Saved to Firestore: <docId>`
   - `[ToolTemplate] Report auto-saved with ID: <docId>`

6. **Watch Tab A (Reports page)** - it should automatically update within 1-2 seconds showing the new report
7. **Watch Console in Tab A** for:
   - `[ReportContext] onSnapshot -> N reports` (where N increases)
   - `[ReportContext] Reports updated, count: N`

### Expected Result:
- ✅ Report appears in Tab A automatically (no refresh needed)
- ✅ Console shows successful save logs
- ✅ Toast notification appears: "Report saved"

## Test 2: Manual Save Button

### Steps:
1. Navigate to any tool page (e.g., `/tools/password`)
2. Run the tool (enter a password, click "Generate" or analyze)
3. Click "Save Report" button
4. **Watch Console** for:
   - `[ToolPageLayout] Manual save triggered`
   - `[ReportContext] saveReport called`
   - `[ReportContext] Saved to Firestore: <docId>`
5. Navigate to `/reports` and verify the report appears

### Expected Result:
- ✅ Report saves successfully
- ✅ Console shows save logs
- ✅ Report appears in Reports page

## Test 3: Live Dashboard Sync (Two Tabs)

### Steps:
1. Open **Tab A**: `/reports` page
2. Open **Tab B**: `/tools/ipinfo` (or any tool)
3. In **Tab A**, open DevTools Console
4. In **Tab B**, run a tool and save the report
5. **Watch Tab A Console** - should show:
   - `[ReportContext] onSnapshot -> N reports`
   - `[ReportContext] Reports updated, count: N`
6. **Watch Tab A UI** - new report should appear automatically

### Expected Result:
- ✅ Reports page updates automatically without refresh
- ✅ Console shows onSnapshot updates
- ✅ New report appears at the top of the list

## Test 4: Firestore Index Error Handling

### Steps:
1. If you see an error in console about missing index:
   - Look for: `[ReportContext] ⚠️ Missing Firestore Composite Index`
   - Check for a Firebase Console link in the error message
2. **If index link is present:**
   - Click the link (or copy from console)
   - Firebase Console should open with index creation form pre-filled
   - Click "Create Index"
   - Wait for index to build (may take a few minutes)
3. **After index is created:**
   - Refresh the app
   - onSnapshot should now work
   - Console should show: `[ReportContext] onSnapshot -> N reports`

### Expected Result:
- ✅ Clear error message with actionable link
- ✅ Index creation link works
- ✅ After index creation, real-time sync works

## Test 5: Polling Fallback (Dev-Only)

### Steps:
1. **Only works in development mode** (`npm start`, not `npm run build`)
2. If onSnapshot fails (e.g., due to missing index), check console for:
   - `[ReportContext] Snapshot failed, polling fallback active (dev-only)`
   - `[ReportContext] poll -> fetching reports...`
   - `[ReportContext] poll -> N reports`
3. Reports should still update, but via polling every 5 seconds instead of real-time

### Expected Result:
- ✅ Polling fallback activates automatically in dev mode
- ✅ Reports still update (just slower, every 5s)
- ✅ Console shows polling logs

## Test 6: Dev-Only Debug Button

### Steps:
1. Navigate to `/reports` page
2. **Only visible in development mode** (`npm start`)
3. Look for "[DEV] Debug Save" button in the header
4. Click the button
5. **Watch Console** for:
   - `[Reports] [DEV] Debug save test triggered`
   - `[ReportContext] saveReport called`
   - `[ReportContext] Saved to Firestore: <docId>`
   - `[Reports] [DEV] Debug save returned: <docId>`
6. Verify a new report with tool: "debug-test" appears in the list

### Expected Result:
- ✅ Debug button only visible in dev mode
- ✅ Clicking it creates a test report
- ✅ Console shows full save lifecycle
- ✅ Test report appears in list

## Test 7: Missing createdAt Handling

### Steps:
1. If you have old reports without `createdAt` field:
2. Check console for warnings:
   - `[ReportContext] report <id> missing createdAt — fallback used`
3. Reports should still display with a fallback timestamp

### Expected Result:
- ✅ Old reports without createdAt still display
- ✅ Console warns about missing createdAt
- ✅ Fallback timestamp is used (readTime or current time)

## Test 8: Error Handling

### Steps:
1. **Test without login:**
   - Logout
   - Try to run a tool and save
   - Should see: "Log in to store reports securely."

2. **Test with invalid data:**
   - Try to save with empty result
   - Should see: "Missing report data"

3. **Test network error:**
   - Disconnect internet
   - Try to save a report
   - Should see error toast with details

### Expected Result:
- ✅ Graceful error handling
- ✅ Clear error messages
- ✅ Console logs error details

## Common Issues & Solutions

### Issue: Reports not saving
- **Check:** Console for `[ReportContext] saveReport called`
- **Check:** User is logged in
- **Check:** Firebase connection (check Network tab)
- **Solution:** Verify Firebase config in `.env`

### Issue: Reports not updating automatically
- **Check:** Console for `[ReportContext] onSnapshot ->` messages
- **Check:** Firestore index exists (see Test 4)
- **Check:** User is logged in
- **Solution:** Create required Firestore index

### Issue: Polling fallback not working
- **Check:** Running in development mode (`npm start`, not production build)
- **Check:** Console for polling logs
- **Solution:** Ensure `NODE_ENV !== 'production'`

### Issue: Debug button not visible
- **Check:** Running in development mode
- **Check:** `process.env.NODE_ENV !== 'production'`
- **Solution:** Use `npm start` not `npm run build`

## Success Criteria

All tests should pass:
- ✅ Reports auto-save after tool runs
- ✅ Reports page updates automatically (live-sync)
- ✅ Console shows comprehensive logging
- ✅ Error handling works gracefully
- ✅ Dev-only features work in development
- ✅ Polling fallback works when needed
- ✅ Missing createdAt handled gracefully

## Notes

- All console logs are prefixed with `[ReportContext]`, `[ToolTemplate]`, `[ToolPageLayout]`, or `[Reports]` for easy filtering
- Use browser console filter to see only report-related logs
- Firestore index creation may take 1-5 minutes to complete
- Polling fallback is dev-only and should not be used in production

