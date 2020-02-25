# Contributing Intructions

> **Note:** this project was created with [EmailThis/extension-boilerplate](https://github.com/EmailThis/extension-boilerplate).

## Installation

1. Clone the repository `git clone https://github.com/BackMarket/github-mermaid-extension.git`
2. Run `yarn`
3. Run `yarn build`

### Load the extension in Chrome & Opera

1. Open Chrome/Opera browser and navigate to chrome://extensions
2. Select "Developer Mode" and then click "Load unpacked extension..."
3. From the file browser, choose to `build/chrome` or (`build/opera`)

### Load the extension in Firefox

1. Open Firefox browser and navigate to about:debugging
2. Click "Load Temporary Add-on" and from the file browser, choose `build/firefox`

## Developing

The following tasks can be used when you want to start developing the extension and want to enable live reload -

- `yarn chrome-watch`
- `yarn opera-watch`
- `yarn firefox-watch`

## Packaging

Run `yarn dist` to create a zipped, production-ready extension for each browser. You can then upload that to the appstore.
