# live-git

A real-time view of the Git status of your team!!!

## To watch your working copies

Just run the install script from inside a cloned Git repository:

```
cd /path/to/working/copy
curl -L http://gitdashboard.com/install | /bin/bash
```

This will create the directory `~/.gitdashboard`, install everything inside a virtualenv there, and run the watcher script. (To uninstall, just delete the directory.)

## Work in Progress Notes...

*Currently branches are assumed to be tracking a remote branch located at "origin"
*We run git fetch from the command line frequently to compare your current repository status to the remote, to avoid prompts for username and password it's best to set up your remote to fetch via ssh
*There is no security

## Running the server

### Prerequisites

* [Install Meteor](http://docs.meteor.com/#quickstart): `curl https://install.meteor.com | /bin/sh`
* [Install meteorite](https://github.com/oortcloud/meteorite#installing-meteorite): `sudo -H npm install -g meteorite`

### Getting started

* `git clone https://github.com/svmehta/live-git.git`
* `cd live-git/python-client && pip install -r requirements.txt`
* `cd ../meteor-live-git && mrt install`
* `meteor`

### EC2 deployment

Before running the above, don't forget to set a security group (allowing in ports 22, 80 and optionally 3000) and install packages:
```
sudo add-apt-repository ppa:chris-lea/node.js \
&& sudo apt-get update \
&& sudo apt-get install -y git nodejs
```

Also, do the git clone into `/var/www/live-git` and run these after cloning:
```
sudo cp /var/www/live-git/deployment/live-git.nginx.conf /etc/nginx/sites-available/live-git \
&& sudo ln -s /etc/nginx/sites-available/live-git /etc/nginx/sites-enabled/live-git

sudo ln -s /var/www/live-git/deployment/init-script.sh /etc/init.d/live-git
sudo ln -s /etc/init.d/live-git /etc/rc2.d/S99live-git
```
