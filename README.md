# DeepRide

DeepRide helps you record deep work "Deep Blocks" and visualize your progress as a climb up the Stelvio Pass.

## Firebase setup

1. Create a Firebase project (or open an existing one) at [console.firebase.google.com](https://console.firebase.google.com/).
2. Go to **Project settings → General → Your apps** and add a new **Web app** if you have not already.
3. Copy the `firebaseConfig` object that Firebase generates for the app.
4. Open [`script.js`](./script.js) and replace the placeholder values inside the `firebaseConfig` object with the values you copied in step 3.
5. Redeploy or reload the site after saving the changes.

If any config values are missing or incorrect you will see a banner in the UI that explains how to fix it, and Firebase operations (login, register, saving deep blocks) will be blocked until the config is valid.

## Local development

1. Replace the Firebase config as described above.
2. Open [`index.html`](./index.html) in a browser.

## Deployment

Deploy by dragging the project folder (containing `index.html`, `style.css`, and `script.js`) into [Netlify Drop](https://app.netlify.com/drop) or uploading it to Vercel as a static site.
