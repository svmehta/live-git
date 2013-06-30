#!/usr/bin/env python

import json
import os
import requests
import githelpers
import argparse

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


def _query_endpoint(path, body={}):
    """
    Helper function for getting the URL of an endpoint
    Only does POST for now
    """
    resp = requests.post(SERVER_ROOT + "/" + path, data=json.dumps(body))
    if not resp.status_code == requests.codes.ok:
        print "There was an error sending data to the server: [%s, %d] %s" % (path, resp.status_code, resp.text)
    return resp


if __name__ == '__main__':
    main()
