# Release notes for version 3.3.0
- Add support for tabs and private tabs (last ones only in headless mode)
- Some configuration variables have been moved inside different object properties, to keep certain order and clarity for future features

# IMPORTANT: migration guide to prepare to version 4.0.0

Version 3.3.0 includes support for tabs and also modifies a few configuration variables for initialization. Read this next steps to prepare your code for migrating from versions =< 3.3.* to version > 4.0.0. 

Although v3.3.0 already implements those changes, it keeps support for people that already has their code ready for versions < 4.0.0. 

The next steps include the changes that you need to implement in order to support the next v4.0.0

#### Module initialization Default tab initialization will be deprecated @v4.0.0 of this module. 
Since version 3.3.0 includes tabs, we needed to add a new layer between the navigation and the browser. That new layer allows tabs managing, including incognito tabs too. 
With that new feature we had to change the main syntax of the module, to support more future features in a tidy and scalable way. 
The new syntax involves one extra step: 

Before: 
```js 
const HeadlessChrome = require('simple-headless-chrome')

const browser = new HeadlessChrome({
  headless: true 
})
async function navigateWebsite() {
  await browser.init()
  // Navigate to a URL
  await browser.goTo('http://www.mywebsite.com/login')

  // ...

  // Close the browser
  await browser.close()
}

navigateWebsite()

```

New syntax:
```js
const HeadlessChrome = require('simple-headless-chrome')

const browser = new HeadlessChrome({
  headless: true 
})
async function navigateWebsite() {
  await browser.init({
    startNewFirstTab: false // Only if you use a version > 3.3.0. If you use >= 4.0.0, you don't need to add this setting
  })

  const mainTab = await browser.newTab({  
    privateTab: false // Optional. Defaults to false
  })

  // Navigate to a URL
  await mainTab.goTo('http://www.mywebsite.com/login')

  // ...

  // Close the browser
  await browser.close()
}

navigateWebsite()
``` 

#### Property "disableGPU" was moved inside the "chrome" object. So you need to change this to support the new version

Before: 
```js
const browser = new HeadlessChrome({
  headless: true,
  disableGPU: true
})
``` 

Since version 3.3.0: 
```js
const browser = new HeadlessChrome({
  headless: true,
  chrome: {
    disableGPU: true
  }
})
``` 

#### Properties "loadPageTimeout", "loadSelectorInterval", "loadSelectorTimeout" and "browserLog" were moved inside the "browser" object in the options. 
Before: 
```js
const browser = new HeadlessChrome({
  headless: true,
  loadPageTimeout: 60000,
  loadSelectorInterval: 500,
  loadSelectorTimeout: 60000,
  browserLog: false // {boolean|function}
})
``` 

Since version 3.3.0: 
```js
const browser = new HeadlessChrome({
  headless: true,
  browser: {
    loadPageTimeout: 60000,
    loadSelectorInterval: 500,
    loadSelectorTimeout: 60000,
    browserLog: false // {boolean|function}
  }
})
``` 