# Node + Sockets + Stripe + Database

## About the Node install

I use Node and NPM to define packages.json, which should have everything you need in it. If anything's missing let me know!

## About the Sockets

These are custom websockets. They work something like this.

### 1. User attaches to website by downloading index.html.
### 2. A cookie is transmitted. This can occur inside index.html or more normally on another page.
### 3. The cookie is used to open a secure web socket.
### 4. Session is considered initialized.
### 5. Any disconnect of the socket will result in an attempt to reconnect.

## About Using Stripe

This is just a basic use case for Stripe. You can configure your settings in lib/config.js.

## About the Database

I have created a disk-backed data storage unit here which has an interface somewhat like Mongoose. You define your
database and tables as objects, then call db.convey() and db.control() to take ownership of those objects, which are
then used to decide when to load and save data, when to archive data, when to replicate it, and when it is no longer
needed. Ok, so archival and replication are not set up yet, and the indexing is very basic. It's cool because it's
a reinvented wheel, not because it's useful.

However, it is useful, providing such features as retaining data between sessions or dropping it, depending on
configuration, and also pre-save/post-load automation for things like removing cleartext passwords or encrypting
them on i/o.

## About the Architecture

I have used a common node.js skeleton syntax for my files, but I am no longer relying on Express. The layout looks
something like this:

### lib/control - Handle URLs and routing requests. Closest to the user.
### lib/data - Manipulate data in the background. 2nd tier, can run in the background using 'workcycle()'.
### lib/base - The database object definitions and any special methods they might need.
### lib/singlets - Single files with URL routing, data manipulation, and tables in one file. For brief things.


## Examples

Just snoop around, it's pretty easy reading.

