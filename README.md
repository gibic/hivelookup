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

You can change your default settings for language and UI selections on `src/lib/config/index.ts`, feel free to add your preferable configurations:

```
export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'id', label: 'Indonesian' }
    // add more languages
];

export const UIOptions = [
    { value: 'https://peakd.com', label: 'PeakD' },
    { value: 'https://hive.blog', label: 'Hive Blog' }
    // add more UI frontend
];

export let selectedValue = 'en';
export let selectedUIValue = 'https://peakd.com';

```

## create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/main/packages/create-svelte).

