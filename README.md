# simple-headless-chrome

# Introduction

This is an abstraction to use a Headless version of Google Chrome in a very simple way.
I was inspired by the next projects:
* Doffy (https://github.com/qieguo2016/doffy)
* Horseman (https://github.com/johntitus/node-horseman)
* chrome-remote-interface (https://github.com/cyrus-and/chrome-remote-interface)
* lighthouse (https://github.com/googlechrome/lighthouse)

And I had to read a lot here too:
*  https://developers.google.com/web/updates/2017/04/headless-chrome
*  https://chromedevtools.github.io/devtools-protocol 

And you can also use this in heroku thanks to https://github.com/heroku/heroku-buildpack-google-chrome

I built this basically because I got tired of an error I received in an edge case when using PhantomJS (Unhandled reject Error: Failed to load url). So I decided to make my own abstraction, to be used in a heroku app, and simple to use as Horseman.

I didn't have time to document here in the readme, but every method in the source code is documented. 

It's really simple to use. I hope I can get some time to make a QuickStart guide + document the API methods here. 

# Collaboration
If you want to collaborate with the project, in any way (documentation, examples, fixes, etc), just send a PR :) 

# Installation

## 1) Install Google Chrome Headless

### In your PC

Mac: Chrome Headless is shipped in Chrome Canary. You can install it here: https://www.google.com/chrome/browser/canary.html

Linux: Chrome headless is shipped on chrome 59. so you can install Chrome 59 to use the headless mode:

https://askubuntu.com/questions/79280/how-to-install-chrome-browser-properly-via-command-line

```
sudo apt-get install libxss1 libappindicator1 libindicator7
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb  # Might show "errors", fixed by next line
sudo apt-get install -f
```

### In a NodeJS Heroku App
Just add the buildpack for Heroku and vualá! Everything is ready
You can check the buildpack repository here: https://github.com/heroku/heroku-buildpack-google-chrome

### Using a Docker image
With the addition of Chrome Remote Interface into Chrome 59, a simple way to install is using the Docker image for Chrome Headless, such as https://hub.docker.com/r/justinribeiro/chrome-headless/ or https://hub.docker.com/r/yukinying/chrome-headless/

If using Docker, in your app, configure for headless as follows:
```js
const browser = new HeadlessChrome({
  headless: true,
  launchChrome: false,
  chrome: {
    host: 'localhost',
    port: 9222, // Chrome Docker default port
    remote: true
  },
  browserlog: true
})
```


## 2) Install the NPM Module

```
npm install --save --simple-headless-chrome
```

# Usage
```js
const HeadlessChrome = require('simple-headless-chrome')

const browser = new HeadlessChrome({
  headless: true // If you turn this off, you can actually see the browser navigate with your instructions
})
```

Once you have the browser instance, you can call the methods to interact with it. 

# Methods (see /lib/actions.js for method parameters and description)

### `browser.inject()` // Needs review!
### `browser.evaluate()`
### `browser.evaluateAsync()`
### `browser.evaluateOnNode()`
### `browser.goTo()`
### `browser.wait()`
### `browser.waitForPageToLoad()`
### `browser.waitForFrameToLoad()`
### `browser.getValue()`
### `browser.setValue()`
### `browser.getNodeValue()`
### `browser.setNodeValue()`
### `browser.fill()`
### `browser.clear()`
### `browser.querySelector()`
### `browser.focus()`
### `browser.type()`
### `browser.select()`
### `browser.keyboardEvent()`
### `browser.mouseEvent()`
### `browser.click()`
### `browser.clickOnSelector()` 
### `browser.getNodeCentroid()`
### `browser.getCookies()`
### `browser.setCookie()`
### `browser.exist()`
### `browser.visible()`
### `browser.printToPDF()`
### `browser.getScreenshot()`
### `browser.saveScreenshot()`
### `browser.getFrames()`
### `browser.handleDialog()`
### `browser.post()`

# Example

```js
const HeadlessChrome = require('simple-headless-chrome')

const browser = new HeadlessChrome({
  headless: true // If you turn this off, you can actually see the browser navigate with your instructions
  // see above if using remote interface
})
async function navigateWebsite() {
  await browser.init()
  // Navigate to a URL
  await browser.goTo('http://www.mywebsite.com/login')

  // Fill an element
  await browser.fill('#username', 'myUser')

  // Type in an element
  await browser.type('#password', 'Yey!ImAPassword!')

  // Click on a button
  await browser.click('#Login')

  // Log some info in your console
  await browser.log('Click login')

  // Wait some time! (2s)
  await browser.wait(2000)
  
  // Log some info in your console, ONLY if you started the app in DEBUG mode (DEBUG='HeadlessChrome*' npm start)
  await browser.debugLog('Waiting 5 seconds to give some time to all the redirects')

  // Navigate a little...
  await browser.goTo('http://www.mywebsite.com/myProfile')

  // Check the select current value
  const myCurrentSubscriptionPlan = await browser.getValue('#subscriptionSelect')
  console.log(myCurrentSubscriptionPlan) // {type: 'string', value: '1 month' }

  // Edit the subscription
  await browser.select('#subscriptionSelect', '3 months')
  await browser.click('#Save')
  
  // Take a screenshot
  await browser.saveScreenshot('./shc.png')
  
  // Get a HTML tag value based on class id
  const htmlTag = await browser.evaluate(function(selector) {
    const selectorHtml = document.querySelector(selector)
    return selectorHtml.innerHTML
  }, '.main'); // returns innerHTML of first matching selector for class "main"

  // Close the browser
  await browser.close()
 }
 navigateWebsite()
```

# TODO: 
### Better docs

### Add more methods
- [ ] .waitForSelector
- [x] .setCookie (set individual cookie) Thanks @saidganim !
- [ ] .setCookies (set a full object of cookies, like the one from .getCookies())

### Support more Chrome flags
- [ ] --disable-translate
- [ ] --disable-extensions
- [ ] --no-first-run
- [ ] And many more! Only those useful...

### And more...
- [ ] Separate the methods in the actions file in actions per Domain (see left menu here: https://chromedevtools.github.io/devtools-protocol/tot/)

- [ ] Allow adding new targets/tabs and controlling them at the same time (https://github.com/cyrus-and/chrome-remote-interface#cdpnewoptions-callback and https://github.com/cyrus-and/chrome-remote-interface/wiki/Inspect-a-new-tab)

- [ ] Improve existing methods:
  .getCookies - Should receive a cookie name and return only that one, or all the cookies if no key is specified

- [ ] Bypass Certificate Errors (https://github.com/cyrus-and/chrome-remote-interface/wiki/Bypass-certificate-errors-(%22Your-connection-is-not-private%22)

- [ ] Add Target domain API 
  So we can create tabs: https://chromedevtools.github.io/devtools-protocol/tot/Target/#method-createTarget


### Tests
I was thinking on using this HTML page to make all the tests: https://github.com/cbracco/html5-test-page
It'd be great to have some unit tests for each HTML element; besides, those test may be useful examples for everyone. 
