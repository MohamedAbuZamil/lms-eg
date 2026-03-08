# Migration Notes: Timed Attempts & Save/Resume Features

## Overview
This migration adds robust timed-attempt behavior, save/resume functionality, and enhanced security features to the Assessment Service.

## Schema Changes

### 1. AttemptStatus Enum - Added Values
- Added `IN_PROGRESS` - Student has started and saved progress
- Added `SUBMITTED_AUTOMATICALLY` - Auto-submitted when time expired

### 2. Assessment Model - New Fields
- `maxAttempts: Int?` - Maximum attempts allowed per student
- `shuffleQuestions: Boolean @default(false)` - Randomize question order per attempt
- `shuffleOptions: Boolean @default(false)` - Randomize MCQ options per attempt
- `randomizeQuestions: Boolean @default(false)` - Select random subset of questions
- `randomQuestionCount: Int?` - Number of questions to randomly select

### 3. Attempt Model - New Fields
- `lastSavedAt: DateTime?` - Last time student saved draft answers
- `expiresAt: DateTime?` - Computed expiry time (startedAt + durationMinutes)
- `selectedQuestionIds: String[]` - Questions selected for randomized assessments
- `questionOrder: Json?` - Shuffled question display order
- `optionsOrder: Json?` - Shuffled option order per question

### 4. AttemptAnswer Model - Enhanced Fields
- `isDraft: Boolean @default(false)` - Whether answer is draft or final
- `answeredAt: DateTime @default(now())` - When answer was first saved
- `lastEditedAt: DateTime @updatedAt` - Last modification time
- Removed `createdAt` and `updatedAt` (replaced with answer-specific timestamps)

## Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name add_timed_attempt_features

# Or create a custom migration file
npx prisma migrate dev --create-only --name add_timed_attempt_features
```

## Data Migration Considerations

### Existing Attempts
- Existing attempts will have `null` for new fields
- `expiresAt` will be computed on-demand for existing timed attempts
- `lastSavedAt` will default to `submittedAt` for already submitted attempts

### Backward Compatibility
- All new fields are nullable or have sensible defaults
- Existing functionality continues to work without changes
- Timed behavior only activates when `durationMinutes` is set

## Feature Enablement

### Timed Assessments
- Set `durationMinutes` on assessment creation
- Attempts automatically get `expiresAt` computed
- System validates attempts haven't expired on save/submit

### Save/Resume
- Students can save draft answers multiple times
- Resume any time before `expiresAt`
- Cross-device support through database persistence

### Question Shuffling
- Enable `shuffleQuestions` on assessment
- Each attempt gets unique question order stored in `questionOrder`

### Max Attempts
- Set `maxAttempts` to limit student attempts
- Students cannot start new attempts if limit reached

### Random Question Selection
- Enable `randomizeQuestions` and set `randomQuestionCount`
- System selects random subset when attempt starts
- Same questions shown consistently during attempt

## Testing Checklist

- [ ] Start timed attempt computes correct `expiresAt`
- [ ] Save draft answers updates `lastSavedAt`
- [ ] Resume returns existing attempt instead of creating duplicate
- [ ] Cannot save after attempt expires
- [ ] Cannot submit after attempt expires (auto-submits instead)
- [ ] Remaining seconds calculated correctly server-side
- [ ] Max attempts enforcement works
- [ ] Question shuffling persists across saves
- [ ] Option shuffling persists across saves
- [ ] Random question selection stable during attempt
- [ ] Correct answers never exposed prematurely
- [ ] Reports handle new attempt states correctly

## Rollback Plan

If issues arise:
1. Revert to previous migration: `npx prisma migrate resolve --rolled-back add_timed_attempt_features`
2. Code remains backward compatible
3. Existing data unaffected
