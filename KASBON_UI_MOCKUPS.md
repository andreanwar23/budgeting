# Kasbon Manager - UI/UX Mockups

## Before & After Comparison

### 1. Kasbon List Item - UNPAID Status

#### BEFORE (No Changes)
```
┌──────────────────────────────────────────────────────────────────┐
│  Hudi                                         [Belum Lunas]      │
│                                                                  │
│  Rp 700.000                                                      │
│                                                                  │
│  Tanggal: 4 Des 2025                                            │
│                                                         [✓][✏️][🗑️] │
└──────────────────────────────────────────────────────────────────┘
Orange tinted background
```

#### AFTER (Same for Unpaid)
```
┌──────────────────────────────────────────────────────────────────┐
│  Hudi                                         [Belum Lunas]      │
│                                                                  │
│  Rp 700.000                                                      │
│                                                                  │
│  Tanggal: 4 Des 2025                                            │
│                                                         [✓][✏️][🗑️] │
└──────────────────────────────────────────────────────────────────┘
Orange tinted background
```

---

### 2. Kasbon List Item - PAID Status

#### BEFORE
```
┌──────────────────────────────────────────────────────────────────┐
│  Hudi                                              [Lunas]       │
│                                                                  │
│  Rp 700.000                                                      │
│                                                                  │
│  Tanggal: 4 Des 2025                                            │
│                                                         [🕐][✏️][🗑️] │
└──────────────────────────────────────────────────────────────────┘
Green tinted background
No paid date visible!
```

#### AFTER (With paid_date badge)
```
┌──────────────────────────────────────────────────────────────────┐
│  Hudi                                              [Lunas]       │
│                                                                  │
│  Rp 700.000                                                      │
│                                                                  │
│  Tanggal: 4 Des 2025                                            │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                        │
│  ┃ ✓ Lunas pada: 4 Des 2025, 14:30    ┃                        │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                        │
│                                                         [🕐][✏️][🗑️] │
└──────────────────────────────────────────────────────────────────┘
Green tinted background
NEW: Prominent green badge shows payment completion time!
```

---

### 3. Create Kasbon Form

#### BEFORE
```
┌─────────────────────────────────────────────┐
│  ✕                    Tambah Kasbon         │
├─────────────────────────────────────────────┤
│                                             │
│  Nama Pemberi/Penerima *                    │
│  [                                        ] │
│                                             │
│  Nominal (Rp) *                             │
│  [                                        ] │
│                                             │
│  Tanggal Kasbon *                           │
│  [                                        ] │
│                                             │
│  Catatan (Opsional)                         │
│  [                                        ] │
│  [                                        ] │
│                                             │
│         [Batal]              [Simpan]       │
└─────────────────────────────────────────────┘
Due date NOT available during creation
```

#### AFTER
```
┌─────────────────────────────────────────────┐
│  ✕                    Tambah Kasbon         │
├─────────────────────────────────────────────┤
│                                             │
│  Nama Pemberi/Penerima *                    │
│  [                                        ] │
│                                             │
│  Nominal (Rp) *                             │
│  [                                        ] │
│                                             │
│  Tanggal Kasbon *                           │
│  [                                        ] │
│                                             │
│  Tanggal Jatuh Tempo (Opsional)             │
│  [                                        ] │
│  Kosongkan jika tidak ada batas waktu       │
│  pelunasan                                  │
│                                             │
│  Catatan (Opsional)                         │
│  [                                        ] │
│  [                                        ] │
│                                             │
│         [Batal]              [Simpan]       │
└─────────────────────────────────────────────┘
NEW: Due date field now available!
NEW: Helpful hint text added
```

---

### 4. Edit Kasbon Form

#### BEFORE
```
┌─────────────────────────────────────────────┐
│  ✕                    Edit Kasbon           │
├─────────────────────────────────────────────┤
│                                             │
│  Nama Pemberi/Penerima *                    │
│  [Hudi                                    ] │
│                                             │
│  Nominal (Rp) *                             │
│  [700000                                  ] │
│                                             │
│  Tanggal Kasbon *                           │
│  [2025-12-04                              ] │
│                                             │
│  Tanggal Jatuh Tempo (Opsional)             │
│  [                                        ] │
│                                             │
│  Status *                                   │
│  [Lunas ▼]                                  │
│                                             │
│  Catatan (Opsional)                         │
│  [                                        ] │
│                                             │
│         [Batal]              [Update]       │
└─────────────────────────────────────────────┘
No hint about paid_date behavior
```

#### AFTER
```
┌─────────────────────────────────────────────┐
│  ✕                    Edit Kasbon           │
├─────────────────────────────────────────────┤
│                                             │
│  Nama Pemberi/Penerima *                    │
│  [Hudi                                    ] │
│                                             │
│  Nominal (Rp) *                             │
│  [700000                                  ] │
│                                             │
│  Tanggal Kasbon *                           │
│  [2025-12-04                              ] │
│                                             │
│  Tanggal Jatuh Tempo (Opsional)             │
│  [                                        ] │
│  Kosongkan jika tidak ada batas waktu       │
│  pelunasan                                  │
│                                             │
│  Status *                                   │
│  [Lunas ▼]                                  │
│  Mengubah status ke "Lunas" akan mencatat   │
│  waktu pelunasan                            │
│                                             │
│  Catatan (Opsional)                         │
│  [                                        ] │
│                                             │
│         [Batal]              [Update]       │
└─────────────────────────────────────────────┘
NEW: Helpful hints added to both fields
NEW: User understands paid_date will be set automatically
```

---

## Detailed Component Specs

### Payment Completion Badge

**Visual Specifications:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ✓ Lunas pada: 4 Des 2025, 14:30    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Background: bg-emerald-100 (#d1fae5)
Border: border-emerald-300 (#6ee7b7)
Text: text-emerald-700 (#047857)
Icon: Check (Lucide React)
Icon Size: 16px (w-4 h-4)
Font: Semibold, 14px
Padding: 6px 12px (py-1.5 px-3)
Border Radius: 8px (rounded-lg)
Display: inline-flex
Alignment: items-center
Gap: 6px (gap-1.5)
```

**Behavior:**
- Only visible when `status === 'paid'` AND `paid_date !== null`
- Shows exact timestamp of when loan was marked as paid
- Updates immediately after status toggle
- Formats date in Indonesian locale

---

## User Interaction Flows

### Flow 1: Quick Toggle to Mark as Paid

```
┌────────────────────┐
│ User sees unpaid   │
│ kasbon in list     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ User clicks green  │
│ checkmark button   │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ System captures    │
│ current timestamp  │
│ Sets paid_date     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ UI updates:        │
│ - Status badge     │
│ - Background color │
│ - NEW: Paid badge  │
│ - Toggle icon      │
└────────────────────┘
```

### Flow 2: Edit Form Status Change

```
┌────────────────────┐
│ User opens edit    │
│ form               │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ User changes       │
│ status dropdown    │
│ to "Lunas"         │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ User sees hint:    │
│ "Mengubah status   │
│ ke 'Lunas' akan    │
│ mencatat waktu     │
│ pelunasan"         │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ User clicks Update │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ System sets        │
│ paid_date to now() │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Form closes,       │
│ list shows paid    │
│ badge with time    │
└────────────────────┘
```

---

## Color Scheme

### Unpaid Status (Orange Theme)
- **Background:** `from-orange-50 to-orange-100` (gradient)
- **Border:** `border-orange-200`
- **Badge BG:** `bg-orange-100`
- **Badge Text:** `text-orange-700`
- **Icon Button BG:** `bg-emerald-100` (checkmark to mark as paid)
- **Icon Button Hover:** `hover:bg-emerald-200`

### Paid Status (Green Theme)
- **Background:** `from-emerald-50 to-emerald-100` (gradient)
- **Border:** `border-emerald-200`
- **Badge BG:** `bg-emerald-100`
- **Badge Text:** `text-emerald-700`
- **Completion Badge BG:** `bg-emerald-100`
- **Completion Badge Border:** `border-emerald-300`
- **Completion Badge Text:** `text-emerald-700`
- **Icon Button BG:** `bg-orange-100` (clock to mark as unpaid)
- **Icon Button Hover:** `hover:bg-orange-200`

---

## Accessibility Considerations

### Screen Reader Support
- Status badge announces: "Status: Lunas" or "Status: Belum Lunas"
- Payment badge announces: "Dibayar pada [date and time]"
- Toggle button has title attribute with action description

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order: Name → Amount → Actions
- Enter/Space activates buttons
- Escape closes edit modal

### Visual Clarity
- High contrast text on all backgrounds
- Clear icon meanings (checkmark = approve, clock = pending)
- Sufficient font sizes (14px minimum)
- Adequate padding and spacing

---

## Responsive Design

### Mobile View (< 640px)
```
┌─────────────────────────────┐
│ Hudi          [Belum Lunas] │
│                             │
│ Rp 700.000                  │
│                             │
│ Tanggal: 4 Des 2025         │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✓ Lunas pada:          │ │
│ │ 4 Des 2025, 14:30      │ │
│ └─────────────────────────┘ │
│                             │
│           [✓] [✏️] [🗑️]      │
└─────────────────────────────┘
```

### Tablet View (640px - 1024px)
```
┌───────────────────────────────────────────┐
│ Hudi                    [Belum Lunas]     │
│                                           │
│ Rp 700.000                                │
│                                           │
│ Tanggal: 4 Des 2025                       │
│ ┌───────────────────────────────┐         │
│ │ ✓ Lunas pada: 4 Des 2025, 14:30│      │
│ └───────────────────────────────┘         │
│                               [✓] [✏️] [🗑️] │
└───────────────────────────────────────────┘
```

### Desktop View (> 1024px)
```
┌──────────────────────────────────────────────────────────────────┐
│  Hudi                                              [Lunas]       │
│                                                                  │
│  Rp 700.000                                                      │
│                                                                  │
│  Tanggal: 4 Des 2025                                            │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                        │
│  ┃ ✓ Lunas pada: 4 Des 2025, 14:30    ┃              [🕐][✏️][🗑️] │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Animation Details

### Status Toggle Animation
```
1. User clicks button
2. Button scales down (0.95) for 100ms
3. Button returns to normal (1.0) for 100ms
4. Loading state (if needed) for API call
5. Card background fades from orange to green (300ms)
6. Status badge fades in new text (200ms)
7. Payment badge slides in from left (300ms ease-out)
8. Toggle button icon rotates 180° (200ms)
```

### Badge Appearance
```
1. Badge appears with opacity 0
2. Fades to opacity 1 over 300ms
3. Slight scale up from 0.95 to 1.0
4. Ease-out timing function
```

---

## Edge Cases Handled

### 1. Rapid Status Toggling
- System handles rapid clicks gracefully
- Last change wins (optimistic updates)
- No race conditions in timestamp capture

### 2. Network Failures
- Error handling shows user-friendly message
- Status reverts to previous state
- paid_date not updated if save fails

### 3. Timezone Handling
- Stored as UTC in database
- Displayed in user's local timezone
- Indonesian locale formatting

### 4. Missing paid_date on Old Records
- Gracefully handles NULL values
- Badge doesn't show (no error)
- Next status change will set timestamp

### 5. Date Formatting Failures
- Fallback to ISO string if locale fails
- No UI breaking errors
- Console warning for debugging

---

## Summary

The UI improvements provide:

1. **Clear Visual Feedback:** Prominent badge shows payment completion
2. **Intuitive Interaction:** Single click to toggle status
3. **Helpful Guidance:** Form hints explain automatic behavior
4. **Flexible Workflow:** Due date editable in all contexts
5. **Consistent Design:** Matches existing color scheme and patterns
6. **Accessible Interface:** Screen reader and keyboard support
7. **Responsive Layout:** Works on all device sizes

All changes maintain the existing design language while adding valuable new information to users.
