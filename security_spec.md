# Security Specification - Auto GTG

## Data Invariants
1. A **Job** must have a valid `customerUid` and a `type` ('scheduled' or 'rsa').
2. Only the assigned **Partner** or an **Admin** can update a Job's status from 'pending' to 'accepted' or 'completed'.
3. A **User** role is immutable after creation except by an **Admin**.
4. **Partners** must be verified by an **Admin** before their status can be 'online'.

## The "Dirty Dozen" Payloads

1. **Identity Theft (Job)**: Attempting to create a job with someone else's `customerUid`.
2. **Role Escalation**: A customer attempting to update their role to 'admin' in their profile.
3. **Status Hijacking**: A customer trying to mark their own job as 'completed' to avoid payment (if payment was status-gated).
4. **Partner Impersonation**: A user trying to accept a job assigned to another partner.
5. **Ghost Job**: Creating a job without a valid service name or type.
6. **Admin Spoofing**: Trying to create an `admin` document in the `users` collection.
7. **PII Leak**: A guest user trying to list the entire `users` collection.
8. **Resource Poisoning**: Sending a 1MB string as a `vehicle` model name.
9. **Orphaned Job**: Creating a job with a non-existent `partnerId` (though partners might be assigned later).
10. **Timeline Tampering**: Providing a `createdAt` timestamp from the future.
11. **Verification Bypass**: A partner setting their own status to 'online' while still `pending_verification`.
12. **Mass Delete**: An authenticated user trying to delete all jobs in the system.

## Test Runner (Conceptual)
The `firestore.rules.test.ts` would verify:
- `auth.uid` matches `customerUid` for job creation.
- `incoming().role` is protected.
- `affectedKeys()` on job updates covers only `status`, `eta`, etc., for partners.
