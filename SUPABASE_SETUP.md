# Contact inbox setup

The contact form keeps its email delivery through FormSubmit and also writes submissions to Supabase for the private admin inbox. It stores the preferred call date/time, an anytime-call preference, and a WhatsApp contact preference along with the request. The browser app uses the Supabase project URL and publishable key. Never put a secret or service-role key in this project.

## 1. Create the database table

In the Supabase project SQL Editor, run the contents of `supabase-schema.sql`. Row-level security allows visitors to submit requests but only an authenticated user whose **app metadata** role is `admin` can read, update, or delete them.

If `contact_requests` already exists, run the updated script again; its `add column if not exists` statements add the scheduling and WhatsApp fields without replacing existing requests.

For realtime new-request alerts, open Database > Publications, edit `supabase_realtime`, and enable `public.contact_requests`.

## 2. Create an administrator

In Authentication > Users, create the administrator user with an email and password. In the SQL Editor, assign the admin role using that exact email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'your-admin-email@example.com';
```

Use app metadata, not user-editable user metadata. Sign out and sign in again after changing the role so the refreshed token contains it. Disable public sign-up in the Supabase Auth settings; create admin accounts only from the project dashboard.

## 3. Configure the browser app

Copy the project URL and publishable key from Project Settings > API Keys into `supabase-config.js`:

```js
window.DESIGN_TREE_AGENCY_SUPABASE = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  publishableKey: 'YOUR_PUBLISHABLE_KEY'
};
```

The publishable key is intended for browser use and is protected by the policies in `supabase-schema.sql`. Do not use a secret or service-role key.

## 4. Run and verify

Serve the project over HTTP or HTTPS; opening the pages as `file://` can block the Supabase client and API requests. From the project directory, a quick local preview is:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/admin.html`, sign in with the admin account, and submit one test request from `index.html`. FormSubmit will ask you to confirm the recipient inbox on its first submission. The dashboard stores contact requests in Supabase; the email copy is still routed through FormSubmit.

## Inbox tools

The dashboard includes search, status filters, status updates, delete, CSV export, and realtime new-request alerts. It shows and exports call and WhatsApp preferences. Theme, page size, and desktop notification preferences are saved in the current browser only.

## Website chat assistant

The floating "Chat with us" widget (`chat-widget.js`) talks to the `chat` Edge Function (`supabase/functions/chat/index.ts`), which calls the Claude API. The Claude API key lives only in Supabase secrets, never in the browser. When a visitor asks to be contacted, the assistant confirms their details and saves them to `contact_requests`, so they appear in the admin inbox marked "[Submitted via website chat]".

1. Create an API key at https://console.anthropic.com (Settings > API Keys) and set a monthly spend limit there (Settings > Limits). The limit is the real cost cap; the function's per-IP limiter only slows bursts.
2. Add the key as a secret: Supabase dashboard > Edge Functions > Secrets > add `ANTHROPIC_API_KEY`. Or, with the Supabase CLI: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
3. Deploy: `supabase functions deploy chat --no-verify-jwt` (the `--no-verify-jwt` flag matches `supabase/config.toml`; the publishable key is not a JWT).
4. Optional: if the site is served from another domain, set `ALLOWED_ORIGINS` (comma-separated, e.g. `https://www.designtreeagency.com,https://example.github.io`). `localhost` and `127.0.0.1` are always allowed for testing.

The assistant's knowledge of services, contact details, and rules is in `SYSTEM_PROMPT` at the top of the function. Update it when services or contact details change, then redeploy.
