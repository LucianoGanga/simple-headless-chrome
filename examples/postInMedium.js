const HeadlessChrome = require('../index')

const title = 'How to tell to a headless Google Chrome to write a post in Medium for you'
const text = `— This post is directed to software developers and curious people —\r
I'm a software developer in a Startup in Argentina. I write code for living, so it's very usual for me facing some frustrating situations where you need to solve something that seems to be easy and fast, but it takes more time than the expected.\r
For those situations, StackOverflow, Google, GitHub and NPM are my best friends, and seeking for existing solutions gives a lot of new ideas to solve the problems. After all, almost everything is already invented by someone somewhere (it does not make sense to reinvent the wheel! Specially with all that people in the world publishing fantastic open source modules where you can contribute and improve with your own ideas)\r
But this time was different. I needed a simple way to tell a browser to navigate a website and extract some data. All the information that I found got me to some incredible modules (node-horseman, other PhantomJS implementations, Selenium, etc), but the problem was that none of them was using a headless version of Google Chrome, the only browser that supported the website I needed to navigate.\r
What is a headless version of a browser? Basically, it's a browser that can be navigated without a user interface, and just by using simple commands like "go to http://images.google.com", "type 'Funny puppy pictures' in the searching box", "save me a screenshot of today's results in my desktop"\r
— Wait, whaaaat? How do I see what I'm browsing?\r
That's the thing! You don't need to see it, you just write the "recipe" that you want the browser to do, and it will do everything for you. (If you want to more about this, you can find it Wikipedia clicking here).\r
So, going back to my problem that day. I couldn't find anything with the specs that I needed, so I decided to build it myself. After reading A LOT that day, and understanding how browsers work behind scenes, I came up with a module that suited my needs: simple-headless-chrome (yeah, I'm not good naming things, so If you have a better name, just write it in the comments!)\r
What does this module do? It's just an abstraction of Google Chrome, that allows me to write those "recipes" in a simple way, so the module does all the work.\r
As I couldn't think of an example to post here, I decided to make a recipe that will automatically write and make this post for me.\r
You can find the recipe clicking here.\r
The main idea of this post was presenting this module so other people that may face the same situation than me, may benefit from this.\r
Besides that, I want to say thanks to all the contributors. Since I uploaded the module on May 19th until today (less than 2 months) 15 persons contributed to the module, and added a lot of really nice features. We receive more contributions than issues, and everyday more people is using this module :)\r
Until next time! And I hope I didn't bored you all with this post (it's my first post and english is not my native language, so… this may have some errors… )`

const browser = new HeadlessChrome({
  headless: false
})
async function postOnMedium () {
  try {
    await browser.init()

    const mainTab = await browser.newTab()

  // Navigate to Medium
    await mainTab.goTo('http://medium.com')

  // Click in logon / signup buttom
    await mainTab.click('[data-action-source="nav_signup"]')

  // Authenticate with FB
    await mainTab.click('[data-action="facebook-auth"]')
    await mainTab.waitForPageToLoad()

    await mainTab.type('input[name="email"]', 'email@example.com')
    await mainTab.type('input[name="pass"]', 'myPassword')
    await mainTab.click('#loginbutton')

    await mainTab.waitForPageToLoad()

  // Again wait for next page, as Facebook redirect us twice
    await mainTab.waitForPageToLoad()

  // Click the "new story" button
    await mainTab.click('[data-action-source="nav_new_story"]')
    await mainTab.wait(2000)

  // Write the Title
    await mainTab.evaluate(function (title) {
      document.querySelector('.graf.graf--h3').innerText = title
    }, title)

  // Write the post
    await mainTab.typeText(text)

    await mainTab.wait(2000)
  // Open the "Publish" menu
    await mainTab.click('[data-action-source="post_edit_prepublish"]')

    await mainTab.wait(3000)
  // Publish the post!
    await mainTab.click('[data-action="publish"]')

  // Close the browser
    await mainTab.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
postOnMedium()
