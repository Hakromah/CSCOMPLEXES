This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


```
=====================================================================================================
Required edits:

1- Login button should redirect to /login
2- website icon should be changed to the logo of AMFOFANA
3- On the Blog page, the Categories (all, news, events) buttons are not working.
4- Nav items only about us have a dropdown menu on hover, the others don't have, I don't know if only about us should have a dropdown menu on hover.
5- On Mobile/Tablet, the Footer sections should display as a grid with 2 or 3 columns. ```

=======================================================================
```
## PULL THE DATA FROM GITHUB TO HETZNER
cd /var/www/AMFOFANA
git pull origin main

## Navigate into the backend CMS folder
cd /var/www/AMFOFANA/strapicms

## 1. Install any newly added package dependencies
npm install

## 2. Clear out old cached production build outputs
rm -rf dist build

## 3. Compile a clean, static production admin panel bundle
NODE_ENV=production npm run build

## 4. Safely reload your backend PM2 process container without downtime
pm2 restart amfofana-backend

## Navigate into the frontend Next.js UI folder
cd /var/www/AMFOFANA/frontend

## 1. Install fresh frontend dependencies
npm install

## 2. Delete the stale Next.js compilation cache folder
rm -rf .next

## 3. Recompile the production static web pages and assets
npm run build

## 4. Reload your frontend PM2 server pool instance
pm2 restart amfofana-frontend
pm2 list
```


