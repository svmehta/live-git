#!/bin/bash
#
# Installer (and runner) script for the Git Dashboard watcher process.
#
# Requires git and pip to already be installed!
#
# Run with:
# curl -L http://gitdashboard.com/install | /bin/bash
#

# Store the current working directory; this is where we'll look for changes
CurrentDir=`pwd`

# Sanity checks
if [ ! -d "$CurrentDir/.git" ]; then
  echo "Current directory doesn't appear to be a Git working directory!"
  echo "cd to something that is being tracked by Git."
  exit 1
fi

if [ ! `which git` ]; then
  echo "Command-line git doesn't appear to be installed."
  echo "Try 'apt-get install git', or install Xcode on OS X";
  exit 1
fi

if [ ! `which pip` ]; then
  echo "Python's pip package manager doesn't appear to be installed."
  echo "Try 'apt-get install python-pip' or 'sudo easy_install pip'";
  exit 1
fi


# We will do everything in a magic directory
if [ ! -d ~/.gitdashboard ]; then
  mkdir ~/.gitdashboard
fi
cd ~/.gitdashboard

# Download and unpack virtualenv, if needed
if [ ! -d virtualenv-1.9.1.tar.gz ]; then
  echo "Installing virtualenv and gitdashboard in ~/.gitdashboard"
  curl -Os https://pypi.python.org/packages/source/v/virtualenv/virtualenv-1.9.1.tar.gz
  tar -zxf virtualenv-1.9.1.tar.gz
fi

# Create and activate one in our magic directory
python virtualenv-1.9.1/virtualenv.py . >/dev/null
source bin/activate

# Can has virtualenv! Now clone/update our repo
if [ -d live-git ]; then
  git --git-dir=live-git/.git fetch >/dev/null 2>&1
  git --git-dir=live-git/.git --work-tree=live-git merge origin/master >/dev/null 2>&1
else
  git clone https://github.com/svmehta/live-git.git >/dev/null 2>&1
fi

# ... and install pip packages
pip install -r live-git/python-client/requirements.txt >/dev/null

# Finally we can run our watcher!
python live-git/python-client/client.py -d "$CurrentDir"
