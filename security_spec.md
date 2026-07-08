# Security Specification - LeadGen AI

## Data Invariants
1. A saved lead must have a valid `userId` matching the authenticated user.
2. A saved lead must have an `id` matching its document ID.
3. Users can only read, update, or delete their own saved leads.
4. `createdAt` must be set to the server time and never modified.

## The Dirty Dozen Payloads (Target: PERMISSION_DENIED)
1. Creating a lead with `userId` of another user.
2. Creating a lead without being signed in.
3. Updating the `userId` of a lead.
4. Updating `createdAt` of a lead.
5. Deleting another user's lead.
6. Reading a lead without being signed in.
7. Listing all leads in a single query (missing userId filter).
8. Injecting a 1MB string into the `name` field.
9. Modifying the `analysis` field of another user's lead.
10. Creating a lead with an invalid ID format.
11. Bypassing status enums (e.g. setting status to 'invalid_status').
12. Attempting to list all leads across all users using a collection group query without constraints.

## Logic Gates
- `isValidId(id)`: Checks string size and regex.
- `isSignedIn()`: Basic auth check.
- `isOwner(userId)`: Checks if `userId == request.auth.uid`.
