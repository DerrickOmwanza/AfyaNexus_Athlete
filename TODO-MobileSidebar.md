# Mobile/Tablet Sidebar Fix

## Issue
- Hamburger press no open in mobile/tablet.
- Need professional modern design.

## Analysis
- TopBar: `lg:hidden` hamburger ✓ (<1024px)
- Sidebar: `open && lg:hidden z-50 fixed inset-0` drawer ✓
- Context/Layout correct.

## Suspects
1. Breakpoint: Tablet needs `md:hidden`? 
2. Z-index/clipping in `h-screen overflow-hidden`
3. Backdrop not blocking clicks.

## Plan
1. Test dev server http://localhost:3000 → DevTools mobile
2. Enhance Sidebar mobile: z-[9999], glass `bg-brand-dark/95 backdrop-blur-2xl shadow-2xl border-r-white/20`
3. TopBar toggle add `aria-expanded={open}`
4. Commit/PR new branch.

**Test First**: Navigate dashboard → F12 → iPhone/iPad → Hamburger press?

Dev server running.

