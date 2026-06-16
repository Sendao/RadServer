# Node + Sockets + Stripe + Database

## About the Node install

I use Node and NPM to define packages.json, which should have everything you need in it. If anything's missing let me know!

## About the Sockets

These are custom websockets. They work something like this.

### 1. User attaches to website by downloading index.html
### 2. A cookie is transmitted. This can occur inside index.html or more normally on another page
### 3. The cookie is used to open a secure web socket
### 4. Session is considered initialized
### 5. Any disconnect of the socket will result in an attempt to reconnect

## About the Code
You can configure your settings in lib/config.js or lib/local-config.js (set mobile=true to disable the web server).
Right now there exists a partially defined dictionary of words and many parsing tools throughout the code, including
JSON and BSON format parsing, these need to be unified and made a common interface.

## About the Database

There is a Graph database that can also store relational tables here. It is still experimental and in the early phases of development,
I may convert it to C++ at some point however the main advantage in javascript is the locally typed memory structures

## About the Architecture

I have used a common node.js skeleton syntax for my files, but I am no longer relying on Express. The layout looks
something like this:

### lib/control - Handle URLs and routing requests. Closest to the user, although singlets have the same functionality, control is more for authentication and global routes
### lib/data - Define and manipulate data. can run in the background using 'workcycle()', define a class and include workcycle for regular updates. call quickSchedule for more detail.
### lib/singlets - Single files with URL routing, data manipulation, and tables in one file
### lib/eccentric - Required Eccentric tooling for various integrations such as email, events, http, object handling/string library support, grammar, etc
### lib/tool - deprecated code that should be moved to eccentric, tools for processing text





