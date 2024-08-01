# Search Hive Content

This is a tool to search Hive content using certain parameters to filter the result. The search feature is powered by Hivesql.

## Using this tool

This tool is meant to use locally by cloning this repository to your local machine.

After cloning, you can then just do 

`npm install`

This will install all dependencies. Then, run

`npm run dev`

This will serve the apps into the browser.

You will need a Hivesql subscription to run this tool. Once registered to Hivesql, you can put your Hivesql credential into a `.env` file.

```
DB_USER=Your-Username
DB_PASSWORD=Yourpassword
DB_SERVER=vip.hivesql.io
DB_DATABASE=DBHive
PORT=3000

```

## create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
