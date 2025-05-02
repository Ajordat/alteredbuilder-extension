# Altered TCG Builder - Browser Extension

![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/fhagbomlpphplemfbeiokgaiiknggpgh?logo=chromewebstore)
![Mozilla Add-on Version](https://img.shields.io/amo/v/altered-tcg-builder?logo=firefox)



The purpose of this extension is to facilitate the integration of third-party tools with the official [Altered TCG website][1]. Currently, its only functionality is to take a decklist generated externally and import it into the official website.

Links:
* [Github Repository][4]
* [Chrome Web Store][3]
* [Firefox Add-ons][6]

---

**Table of Contents**
1. [Disclaimer](#disclaimer)
2. [Development](#development)
   1. [Initial setup](#initial-setup)
   2. [Chrome](#chrome)
   3. [Firefox](#firefox)
3. [Publishment](#publishment)



## Disclaimer

This extension is designed with your security and privacy in mind. It uses your session token solely to authenticate with the official website and perform the deck import process. The token is retrieved directly from your browser's cookies and is never stored, shared, or used for any purpose beyond importing your deck. Once the import is complete, the token is immediately discarded. The extension does not save any of your personal data or interact with any third-party servers.

To ensure complete transparency, the extension's code is open-source and licensed under the GPL-3.0. This means anyone can review the code to verify its functionality and security. The repository is publicly available, providing you with the opportunity to see exactly how the token is used and to confirm that it is only utilized to communicate with the official website's API during the import process. If you have any questions or concerns, feel free to reach out or explore the code yourself!


## Development

### Initial setup

1. [Install npm][5]
2. Install the npm dependencies with:
   ```
   npm install
   ```

After the initial setup, developing for Chrome or Firefox has its differences:

### Chrome

3. Build the extension with:
   ```
   npm run build:chrome
   ```
   This command creates the `dist/` folder with the source code bundled.
4. In Google Chrome, go to `chrome://extensions/` and enable the developer mode (top right corner).
5. Click on `Load unpacked` and select the `dist/` folder.

With these steps, the extension will be "installed" in the browser.

Nevertheless, instead of manually building the extension with every change (step 3), the recommended way to develop is to run:
```
npm run watch
```
The above command will watch the source code and will hot-reload the bundle every time it detects a change on any file. *Usually* the browser also realizes that there's been a change and updates it as well.

### Firefox

3. Build the extension with:
   ```
   npm run build:firefox
   ```
   This command creates the `dist/` folder with the source code bundled.
4. **Manually** generate a zip file from the contents of the `dist/` folder. Do it with the contents of the folder, not the folder itself.
   
   Yes, I know: I should automate this with npm.
5. Go to `about:debugging` and then "This Firefox".
6. Click on `Load Temporary Add-on...` and select the zip file generated in step 4.

With these steps, the extension will be "installed" in the browser.

Nevertheless, instead of doing all those steps every time, the recommended way to develop is to run:
```
npm run start:firefox
```
The above command will start a sandboxed version of Firefox and should hot-reload the extension with every changed file on the `dist/` folder. This means that running `npm run build:firefox` is mandatory to refresh the changes.

## Publishment

The publishment process is automated through Github Actions and [this pipeline][2].

Currently a new revision is uploaded every time there's a commit in the master branch. Ideally I'd like it to be automatically published only when the version in [package.json](package.json) is increased, but it's not done yet.


[1]: https://www.altered.gg/
[2]: https://github.com/Ajordat/alteredbuilder-extension/blob/master/.github/workflows/publish.yaml
[3]: https://chromewebstore.google.com/detail/altered-tcg-builder/fhagbomlpphplemfbeiokgaiiknggpgh
[4]: https://github.com/Ajordat/alteredbuilder-extension
[5]: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
[6]: https://addons.mozilla.org/en-US/firefox/addon/altered-tcg-builder/