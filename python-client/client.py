#!/usr/bin/env python

import daemon
import os
import requests
import githelpers
import argparse

BOOTSTRAP_DOTFILE = ".gitlive"
SERVER_ROOT = "http://localhost:3000"

# with daemon.DaemonContext():
#     print "foo"

def main():
    # Handle command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", dest="git_directory", default=None)
    args = parser.parse_args()

    git_directory = os.path.abspath(args.git_directory) or os.getcwd()

    bootstrap_path = os.path.join(os.path.expanduser("~"), BOOTSTRAP_DOTFILE)

    # Bootstrap file: expect computerId on first line, userId on second
    if not os.path.exists(bootstrap_path):
        user_info = githelpers.get_computer_info(git_directory)["user"]
        print user_info
        resp = _query_endpoint("bootstrap", user_info).json()
        userId, computerId = resp["userId"], resp["computerId"]
        with open(bootstrap_path, "w") as f:
            f.write(computerId)
            f.write("\n")
            f.write(userId)
    else:
        with open(bootstrap_path, "r") as f:
            s = f.read()
            computerId, userId = s.strip().split("\n")

    working_copy = githelpers.get_working_copy({
        "userId": userId,
        "computerId": computerId
    }, git_directory)

    working_resp = _query_endpoint("update", working_copy)

    print working_copy  # TODO remove

def _query_endpoint(path, body={}):
    """
    Helper function for getting the URL of an endpoint
    Only does POST for now
    """
    resp = requests.post(SERVER_ROOT + "/" + path, data=body)
    if not resp.status_code == requests.codes.ok:
        print "There was an error sending data to the server: [%s, %d] %s" % (path, resp.status_code, resp.text)
    return resp


if __name__ == '__main__':
    main()
