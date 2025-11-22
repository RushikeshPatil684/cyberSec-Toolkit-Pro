# QA Checklist: Remove Client-Side PFP Upload

## Overview
Client-side profile picture (PFP) upload functionality has been disabled. Avatars are now admin-managed only. Users can still view their existing avatars, but cannot upload or change them from the client.

## Prerequisites

1. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```
   Verify UI is running at `http://localhost:3000`

2. **Login**
   - Navigate to `/login` or `/signup`
   - Use a test Firebase account
   - Verify you're logged in (check Navbar for user avatar)

## Test 1: Verify Upload UI is Removed

### Steps:
1. Navigate to `/profile` page
2. Look for avatar section (should show existing avatar if user has one)
3. **Check for upload button:**
   - Should NOT see a camera icon button to upload
   - Should NOT see a file input field
   - Should see a disabled/grayed-out camera icon (if REACT_APP_ALLOW_AVATAR_UPLOAD is not set)
4. **Check for info message:**
   - Should see text: "Avatar changes are disabled. Contact an administrator to update avatar."

### Expected Result:
- ✅ No active upload button visible
- ✅ Info message displayed about disabled uploads
- ✅ Existing avatar still displays (if user has photoURL)

## Test 2: Verify Upload Handler is Disabled

### Steps:
1. Navigate to `/profile` page
2. Open browser DevTools Console (F12)
3. If upload button is visible (when REACT_APP_ALLOW_AVATAR_UPLOAD=true), try to click it
4. **Watch Console** for:
   - `[RemovePFP] client-side avatar upload suppressed (admin-managed)`
5. **Check Toast Notification:**
   - Should see: "Avatar uploads are disabled. Contact an administrator to update your avatar."

### Expected Result:
- ✅ Console shows suppression message
- ✅ Toast notification appears
- ✅ No actual upload occurs

## Test 3: Verify Avatar Display Still Works

### Steps:
1. Login with a user that has an existing `photoURL` (from Firebase Auth or Firestore)
2. Navigate to `/profile` page
3. **Check Avatar Display:**
   - Avatar should display if `currentUser.photoURL` exists
   - Avatar should use proper CSS: `object-cover`, `rounded-full`
   - Avatar should have proper z-index (`z-30 relative`)
4. Navigate to any page with Navbar
5. **Check Navbar Avatar:**
   - Avatar should display in Navbar if `currentUser.photoURL` exists
   - Fallback (initial letter) should show if no photoURL

### Expected Result:
- ✅ Existing avatars display correctly
- ✅ Fallback avatars work when photoURL is missing
- ✅ No CSS issues hiding avatars

## Test 4: Verify Environment Variable Guard

### Steps:
1. **Test with upload disabled (default):**
   - Ensure `REACT_APP_ALLOW_AVATAR_UPLOAD` is NOT set in `.env`
   - Navigate to `/profile`
   - Verify upload button is hidden/disabled
   - Verify info message is shown

2. **Test with upload enabled (if needed for testing):**
   - Add `REACT_APP_ALLOW_AVATAR_UPLOAD=true` to `frontend/.env`
   - Restart frontend (`npm start`)
   - Navigate to `/profile`
   - Upload button should be visible
   - But upload handler still shows suppression message (code is commented out)

### Expected Result:
- ✅ Default behavior: upload disabled
- ✅ Environment variable controls UI visibility
- ✅ Upload handler still suppressed even if button visible

## Test 5: Verify Console Logging

### Steps:
1. Navigate to `/profile` page
2. Open browser DevTools Console (F12)
3. **Check Console** for:
   - `[RemovePFP]` prefixed messages when visiting profile
   - No errors related to missing imports (storage, updateProfile, etc.)

### Expected Result:
- ✅ Console shows `[RemovePFP]` messages
- ✅ No import errors
- ✅ No runtime errors

## Test 6: Verify No Upload-Related Imports

### Steps:
1. Check `frontend/src/pages/Profile.jsx`
2. **Verify imports are commented out:**
   - `uploadBytesResumable`, `getDownloadURL`, `deleteObject` from firebase/storage
   - `updateProfile`, `reload` from firebase/auth
   - `storage` from firebase config
3. **Verify code is commented, not deleted:**
   - Original upload handler code should be in comments
   - Easy to re-enable if needed

### Expected Result:
- ✅ Upload-related imports commented out
- ✅ Original code preserved in comments
- ✅ No broken imports

## Test 7: Verify Backward Compatibility

### Steps:
1. Login with existing user that has photoURL
2. Navigate to `/profile`
3. **Verify:**
   - Existing avatar displays
   - Profile page loads without errors
   - No broken functionality

### Expected Result:
- ✅ Existing users see their avatars
- ✅ No breaking changes
- ✅ All other profile features work

## Common Issues & Solutions

### Issue: Upload button still visible
- **Check:** `REACT_APP_ALLOW_AVATAR_UPLOAD` environment variable
- **Solution:** Ensure it's not set to `true` in `.env` file

### Issue: Avatar not displaying
- **Check:** User has `currentUser.photoURL` set in Firebase Auth
- **Check:** Console for image load errors
- **Solution:** Verify Firebase Storage rules allow read access

### Issue: Console errors about missing imports
- **Check:** All upload-related imports are commented out
- **Solution:** Verify `Profile.jsx` has imports properly commented

### Issue: Upload handler still executes
- **Check:** `handlePhotoUpload` function has guard at the start
- **Solution:** Verify function returns early with suppression message

## Success Criteria

All tests should pass:
- ✅ Upload UI removed/hidden
- ✅ Upload handler suppressed with console logging
- ✅ Avatar display still works for existing users
- ✅ Environment variable guard works
- ✅ Console shows `[RemovePFP]` messages
- ✅ No broken imports or runtime errors
- ✅ Backward compatible with existing avatars

## Notes

- Upload functionality can be re-enabled by:
  1. Setting `REACT_APP_ALLOW_AVATAR_UPLOAD=true` in `.env`
  2. Uncommenting the upload-related imports
  3. Uncommenting the upload handler code
  4. Uncommenting the upload button in JSX

- All original code is preserved in comments for easy restoration
- Avatar display is read-only - users can see avatars but cannot change them
- Admin-managed avatars should be updated via Firebase Admin SDK or Firebase Console

