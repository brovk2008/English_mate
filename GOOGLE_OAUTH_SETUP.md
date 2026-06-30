# Google OAuth Setup Guide

To enable Google sign-in for **Sakura-Ez**, you need to configure an OAuth 2.0 client in the Google Cloud Console and enable the provider in your Supabase project.

---

## Step 1: Get Callback URL from Supabase

1. Open your **Supabase Dashboard** and go to your project.
2. Navigate to **Authentication** > **Providers** (under Configuration).
3. Find **Google** in the list, expand it, and locate the **Redirect URI**. It will look like:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy this URI.

---

## Step 2: Create Credentials on Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - Select **External** (if using a standard Gmail account) and click **Create**.
   - Fill in the required fields: App name (**Sakura-Ez**), User support email, and Developer contact information.
   - Click **Save and Continue** through the scopes and test users sections.
4. Go to **APIs & Services** > **Credentials**:
   - Click **+ Create Credentials** at the top and select **OAuth client ID**.
   - Under **Application type**, select **Web application**.
   - Under **Name**, enter `Sakura-Ez Client`.
   - Under **Authorized JavaScript origins**, add:
     `https://<your-project-ref>.supabase.co`
   - Under **Authorized redirect URIs**, paste the Redirect URI you copied from Supabase in Step 1.
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret** from the modal that appears.

---

## Step 3: Enable Google Provider in Supabase

1. Return to **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
2. Toggle Google sign-in to **Enabled**.
3. Paste the **Client ID** and **Client Secret** you copied in Step 2.
4. Click **Save** at the bottom.

---

## Step 4: Verification

Start your local Next.js server (`npm run dev`) and click **Sign in with Google** on the home page. The application will route the sign-in flow through Google, redirect to `/auth/callback`, initialize your profile, and take you to `/home`!
