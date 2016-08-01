Auto Deploy
====

###Objective
* To provide a way to automatically deply code from github to your server when a event happens.
* Give option for multiple deploy strategy based on server, branch and repo etc.

###Roadmap
* To allow user to login via gihub - Done
* Fetch repolist from the user's github page - Done
* Fetch branch list from the same repo - Done
* Ask for server details - Done
* Add the webhook to the selected repo - Done
* Use `mongo` to store all data and `angular.js` for form - Done
* Perform command on server when webhook url is touched - Done
* Make code DRY. Test it out. Fix minor bugs - ToDo

###To run
* install `node.js` . Prefer version > 4.
* install `mongodb`.
* Modify all `sample.*` files and save as `*` files.
* Perform `npm install`
* Do `node app.js`