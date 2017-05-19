# simple-headless-chrome

This is an abstraction to use a Headless version of Google Chrome in a simple way.
I was inspired by the next projects:
- Doffy (https://github.com/qieguo2016/doffy)
- Horseman (https://github.com/johntitus/node-horseman)
- chrome-remote-interface (https://github.com/cyrus-and/chrome-remote-interface)

And I had to read a lot here too:
-  https://developers.google.com/web/updates/2017/04/headless-chrome
-  https://chromedevtools.github.io/devtools-protocol 

And you can use this in heroku thanks to https://github.com/heroku/heroku-buildpack-google-chrome

I built this basically because I got tired of an error I received in an edge case when using PhantomJS (Unhandled reject Error: Failed to load url). So I decided to make my own abstraction, to be used in a heroku app, and simple to use as Horseman.

I didn't have time to document here in the readme, but every method in the source code is documented. 

It's really simple to use. I hope I can get some time to make a QuickStart guide + document the API methods here. 

If you want to collaborate with the project, in any way, just send a PR :) 

# Example

const HeadlessChrome = require('simple-headless-chrome')

const browser = new HeadlessChrome({
  headless: true // If you turn this off, you can actually see the browser navigate with your instructions
})
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

// Close the browser
await browser.close()


# TODO: 
- Add more methods:
  .waitForSelector
  .screenshot
  .waitForPageToLoad

- Bypass Certificate Errors (https://github.com/cyrus-and/chrome-remote-interface/wiki/Bypass-certificate-errors-(%22Your-connection-is-not-private%22)

)