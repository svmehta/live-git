#!/usr/bin/env python

import os
import requests
import githelpers
import argparse
import time
import json

BOOTSTRAP_DOTFILE = ".gitlive"
SERVER_ROOT = "http://localhost:3000"

def main():
    # Handle command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", dest="git_directory", default=None)
    args = parser.parse_args()

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
        with open(bootstrap_path, "w") as f:
            f.write(computerId)
            f.write("\n")
            f.write(userId)
            f.write("\n")
            f.write(repositoryId)
    else:
        with open(bootstrap_path, "r") as f:
            s = f.read()
            computerId, userId, repositoryId = s.strip().split("\n")

    print 'Your project dashboard is located at ' + SERVER_ROOT + '/' + repositoryId

    while True:
        working_copy = githelpers.get_working_copy({
            "userId": userId,
            "computerId": computerId
        }, git_directory)

        working_resp = _query_endpoint("update", working_copy)
        time.sleep (60)

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
    main()
