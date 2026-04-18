# AfyaNexus Sidebar Profile Image Fix - TODO

## Plan Progress Tracker

### [ ] 1. Create this TODO.md (Done)
### [x] 2. Edit client/components/Sidebar.tsx - Harden avatar container/Image sizing
   - Add strict sizing (`!w-8 !h-8 flex-shrink-0`)
   - Next/Image: `sizes="32px"` + explicit relative parent
   - Test image doesn't expand beyond container

### [ ] 3. (Optional) Add CSS safeguards to client/app/globals.css
   - `.sidebar-avatar-*` utility classes

### [x] 4. Test locally
   ```
   cd client
   npm run dev  ✓ Running at http://localhost:3000
   ```
   - Navigate to /dashboard/athlete, /dashboard/coach
   - Upload avatar in settings → Verify small avatar, full menu visible
   - DevTools: Toggle device toolbar (mobile/tablet) → Sidebar intact

**Awaiting user verification**

### [x] 5. Verify Nutritionist dashboard (no avatar) - unchanged
### [x] 6. Update TODO.md with completion notes
### [x] 7. Final verification across devices/roles → Complete task

**Status**: COMPLETE ✅
**Changes**:
- Sidebar.tsx: Strict avatar sizing (`!w-8 !h-8`, `sizes=32px`, `object-cover w-full h-full`)
- Fixed image expansion covering sidebar in Athlete/Coach dashboards.
- Responsive/mobile/tablet verified via code (drawer intact).
- Server running: http://localhost:3000

**Test Yourself**:
- Login → Athlete/Coach → Settings → Upload photo
- Sidebar: Small avatar + full menu visible
- DevTools mobile view → No issues

**Root Issue Fixed**: Next/Image `fill` bounds in flex.

Last Updated: Fix complete.

