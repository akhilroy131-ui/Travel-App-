# Roam — Frontend Plan

You said you don't want to build UI/UX yet. Good instinct — but "not yet" should mean
*designed but not coded*, not *undecided*. Agents are excellent at turning a settled screen
into code and terrible at inventing product decisions mid-implementation. Every hour spent
settling a screen saves several hours of agent churn.

## Recommended order

```
1. Schema          ← done (supabase/migrations)
2. Design          ← next: Figma, screen by screen
3. Data hooks      ← generated types + TanStack Query, derived from 1
4. Screens         ← derived from 2 + 3
```

Steps 3 and 4 can run in parallel once 2 is locked, because the hooks depend only on the
schema. That's the payoff for doing schema first.

## Screen inventory for V1

Screens that already exist are marked. Everything else is new.

### Traveller

| Screen | Status | Notes |
|---|---|---|
| Welcome / SignIn / SignUp | exists | Remove role selection — everyone starts as a traveller |
| Explore (map) | exists | Rebuild behind `<RoamMap>`; add cluster handling |
| Search results | **new** | Text + filter sheet; calls `search_experiences` |
| Filter sheet | **new** | Category, price, rating, distance, date range |
| Experience detail | exists | Add availability calendar strip, save button, contact host |
| Host landing | exists | Add "verified" slot (V2), phone reveal |
| Saved / wishlist | **new** | Flat list, swipe to remove |
| Profile | exists | Add "Become a host" entry point |
| Photo wall / create post | exists | — |

### Host

| Screen | Status | Notes |
|---|---|---|
| Become a host | **new** | Creates `host_profiles` row; phone entry |
| My listings | **new** | Draft / published tabs |
| Create experience | **new** | Multi-step: basics → photos → location → price → availability |
| Location picker | **new** | Map pin drop + geocoded place search |
| Availability editor | **new** | Weekly pattern → `availability_rules`, then blocked-date overrides |
| Edit / unpublish | **new** | Reuses the create flow |

Eleven new screens. The create-experience flow is the single biggest piece and should be
specced on its own.

## The two screens that need real design thought

Everything else is conventional. These two aren't:

**Availability editor.** Hosts think in patterns ("weekends, 9am") but need to override
specific dates ("not the 14th"). The schema supports both — `availability_rules` generates,
`experience_availability` overrides. The UI has to make that two-layer model feel like one
thing. Get this wrong and hosts won't list.

**Filter sheet.** Six filter dimensions is enough to feel heavy. Which are visible by
default, which are behind "more", and what happens when a combination returns zero results,
are product decisions, not implementation details.

## Doing the design in Figma

You have the Figma MCP connected, which makes this a genuinely good loop:

1. I generate screens into a Figma file from the inventory above.
2. You open it, move things, change what's wrong, comment on what you don't like.
3. I read the file back — `get_design_context` returns the real node tree, auto-layout,
   variables, and design tokens, not a screenshot guess.
4. That structured context goes into the implementation spec, so the agent builds from
   actual spacing and colour tokens instead of eyeballing a picture.

That last step is the whole reason to use Figma rather than sketching in chat. The
difference in agent output between "build a card component" and "build this card component,
here are the tokens" is large.

Start with a design-token pass (colours, type scale, spacing — port from
`V1/constants/theme.ts` so code and design agree from day one), then the two hard screens,
then the rest.

## Implementation notes for whoever builds this

- One `useSearchExperiences` hook wrapping the `search_experiences` RPC. Do not rebuild
  PostgREST chaining — the RPC already does the work.
- `total_count` comes back on every search row; read it from index 0 for pagination.
- Wishlist state is a good candidate for TanStack Query optimistic updates with rollback —
  unlike the current `useToggleLike`, which claims to be optimistic and isn't.
- The availability strip on the detail screen only needs `next_available` plus a month of
  slots. Don't fetch the whole calendar.
- Phone numbers come from `get_host_contact()`, never from a table select. The reveal is
  logged, so the button should feel like a deliberate action, not an auto-load.
