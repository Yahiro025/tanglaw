-- Add provider identity fields to an existing TANGLAW database.
ALTER TABLE public."User"
    ADD COLUMN IF NOT EXISTS "authProvider" TEXT,
    ADD COLUMN IF NOT EXISTS "authProviderAccountId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_authProvider_authProviderAccountId_key"
    ON public."User" ("authProvider", "authProviderAccountId");

-- Read-only check: fails if the OAuth query cannot read the required fields.
SELECT id, email, name, "passwordHash", "emailVerified",
       "authProvider", "authProviderAccountId"
FROM public."User"
LIMIT 0;
