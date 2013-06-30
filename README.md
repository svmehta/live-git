live-git
========

A real-time view of the Git status of your team.


## Getting started

* `git clone https://github.com/svmehta/live-git.git`
* `cd live-git/meteor-live-git && mrt install`
* `meteor`

## EC2 deployment

Before running the above, don't forget to:
* Set up a security group allowing in ports 22 and 80 (and optionally 3000)
* `sudo add-apt-repository ppa:chris-lea/node.js && sudo apt-get update && sudo apt-get install -y git nodejs`
* [Install Meteor](http://docs.meteor.com/#quickstart): `curl https://install.meteor.com | /bin/sh`
* [Install meteorite](https://github.com/oortcloud/meteorite#installing-meteorite): `sudo -H npm install -g meteorite`


