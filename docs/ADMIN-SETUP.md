# GAC.CA Administrator Room setup

This is a fictional roleplay website. It is not a Canadian government service.

## Required Vercel environment variables

Configure these in the Vercel project settings for Production, Preview, and Development as appropriate:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://qksgheshblgmijvpzvyw.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = the publishable key for the separate `GAC-CA-Admin` Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` = the Supabase Secret key (`sb_secret_…`) or legacy `service_role` key for that project; server-side only, never prefix it with `NEXT_PUBLIC_`
- `GAC_GITHUB_TOKEN` = a fine-grained GitHub token restricted to `carrington-rblx/GAC.CA` with Contents read/write access; server-side only

After saving environment variables, redeploy the site. Do not put either secret into source control, browser code, screenshots, or chat messages.

## Bootstrap the first administrator

1. In the Supabase project `GAC-CA-Admin`, open Authentication → Users and create/invite the administrator's own account.
2. Copy that user's UUID from the user details.
3. Open the SQL Editor and run the following query after replacing the UUID and display name. This is a one-time trusted setup operation.

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'REPLACE-WITH-ADMIN-USER-UUID';

insert into public.staff_profiles (id, display_name, role, active)
values ('REPLACE-WITH-ADMIN-USER-UUID', 'REPLACE-WITH-DISPLAY-NAME', 'admin', true)
on conflict (id) do update
set display_name = excluded.display_name, role = 'admin', active = true;
```

4. Sign out and sign back in at `/admin` so the refreshed authentication token includes the trusted role.
5. After the administrator signs in, use **Staff permissions → Create staff account** to create a staff login using a Roblox username. The dashboard generates a temporary password to share privately; staff do not need an email address. Assign **Visa staff** for visa-request handling only. The administrator remains the only account with website content and staff-management permissions.
6. Set the Supabase Auth site's Site URL and redirect allowlist to the deployed site domain so invitation links return to the website.

## Application and content management\n\nThe Administrator Room uses click-and-fill forms for travel notices, ministry personnel, publications, diplomatic careers, treaties, operations, homepage updates, staff permissions, citizen profile validation, and visa/passport application review. Uploaded PDFs and images are stored in the `gac-public-assets` bucket; citizen profile images use `gac-profile-images`. Both buckets have row-level storage policies.\n\nVisa/passport and career requests are stored server-side and receive reference numbers. Applicants can check status using the reference number and Roblox username. When a document is validated, staff can record its number and validity dates so the citizen account can display them.\n\n## Publishing approved content to GitHub

The dashboard's publish action writes a snapshot of currently published records to `data/published-content.json` on the `main` branch. GitHub token access must be restricted to this repository. The live public travel-advice and publications pages read published records from Supabase; the GitHub snapshot provides the repository commit/audit trail and triggers the usual deployment integration.

## Database and security

The administrator database is a separate Supabase project from TCN Newsroom. Row-level security is enabled. Public visitors can read only records marked published. Editors can submit proposals and read content for context, but cannot directly modify content tables. The service-role key is used only in server API routes for editor invitations and GitHub snapshot publishing.
