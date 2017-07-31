# Release notes for version 3.3.0

## IMPORTANT: Default tab initialization will be deprecated @v4.0.0 of this module. 
Since version 3.3.0 includes tabs managing, we needed to add a new layer between the navigation and the browser. That new layer allows tabs managing, including incognito tabs too. 
With that new feature we had to change the main syntax of the module, to support more future features in a tidy way. 
The new correct syntax involves one extra step: 

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
  await browser.init()

  const mainTab = await browser.newTab({  
    privateTab: false 
  })

  // Navigate to a URL
  await mainTab.goTo('http://www.mywebsite.com/login')

  // ...

  // Close the browser
  await browser.exit()
}

navigateWebsite()
``` 

- Property "disableGPU" was moved inside the "chrome" object. So you need to change this to support the new version

- Properties "loadPageTimeout", "loadSelectorInterval", "loadSelectorTimeout" and "browserLog" were moved inside the "browser" object in the options. 