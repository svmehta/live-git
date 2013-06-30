#!/usr/bin/env python

import os
import sys
import requests
import githelpers
import argparse
import time
import json

BOOTSTRAP_DOTFILE = ".gitdashboard/watcher_config"
SERVER_ROOT = "http://gitdashboard.com"


# http://stackoverflow.com/a/4104188
def runOnce(f):
    def wrapper(*args, **kwargs):
        if not wrapper.has_run:
            wrapper.has_run = True
            return f(*args, **kwargs)
    wrapper.has_run = False
    return wrapper

@runOnce
def printWelcomeMessage(repositoryId):
    print 'Watching directory for changes (CTRL-C to exit)'
    print 'Your project dashboard is located at ' + SERVER_ROOT + '/' + repositoryId


def main():
    # Handle command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", dest="git_directory", default=None)
    parser.add_argument("-p", dest="poll_timeout", type=int, default=5)
    parser.add_argument("--local", action="store_true")


    args = parser.parse_args()

    if args.local:
        global SERVER_ROOT
        SERVER_ROOT = "http://localhost:3000"

    if args.git_directory:
        git_directory = os.path.abspath(args.git_directory)
    else:
        git_directory = os.getcwd()

    bootstrap_path = os.path.join(os.path.expanduser("~"), BOOTSTRAP_DOTFILE)

    # Bootstrap file: expect computerId on first line, userId on second
    if not os.path.exists(bootstrap_path):
        user_info = githelpers.get_computer_info(git_directory)
        resp = _query_endpoint("bootstrap", user_info).json()
        userId, computerId, repositoryId = resp["userId"], resp["computerId"], resp["repositoryId"]
        printWelcomeMessage(repositoryId)
        with open(bootstrap_path, "w") as f:
            f.write(computerId)
            f.write("\n")
            f.write(userId)
    else:
        with open(bootstrap_path, "r") as f:
            s = f.read()
            computerId, userId = s.strip().split("\n")


    while True:
        working_copy = githelpers.get_working_copy({
            "userId": userId,
            "computerId": computerId
        }, git_directory)

        working_resp = _query_endpoint("update", working_copy).json()
        printWelcomeMessage(working_resp["repositoryId"])

        time.sleep(args.poll_timeout)


def _query_endpoint(path, body={}):
    """
    Helper function for getting the URL of an endpoint
    Only does POST for now
    """
    resp = requests.post(SERVER_ROOT + "/" + path, data=json.dumps(body), headers={'content-type': 'application/json'})
    if not resp.status_code == requests.codes.ok:
        print "There was an error sending data to the server: [%s, %d] %s" % (path, resp.status_code, resp.text)
    return resp


if __name__ == '__main__':
   try:
      main()
   except KeyboardInterrupt:
      print "\nStopped!"
      sys.exit()
