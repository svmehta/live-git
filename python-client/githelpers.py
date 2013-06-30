#!/usr/bin/env python
"""
Scripts for retrieving data about the git repository
"""

from git import *
import os, sys
import gitstatus
import time

def get_repo(dirpath):
    """
    Validates whether the script was run in a git repository,
    then returns the pygit2 Repo object
    """
    git_directory = os.path.join(dirpath + "/.git/")

    if not os.path.exists(git_directory):
        print "We couldn't find a .git/ directory in the current working directory. Are you in the root of the git repository?"
        sys.exit(1)    
    elif not os.path.isdir(git_directory):
        print "We found a file named .git/, but it should be a directory."
        sys.exit(1)

    return Repo.init(dirpath)


def get_computer_info(dirpath):
    """
    TODO
    """
    repo = get_repo(dirpath)

    # Read in git config
    config = repo.config_reader()
    user_name = config.get_value("user", "name")
    user_email = config.get_value("user", "email")
    origin_remote, remote_url = _get_remote_origin(repo)

    computer = {
        "name": user_name,
        "email": user_email,
        "remoteUrl": remote_url
    }
    
    return computer


def get_working_copy(params, dirpath):
    """
    Returns:
    """
    repo = get_repo(dirpath)

    # Gather branch information
    current_branch = repo.active_branch
    untracked_files = repo.untracked_files
    untracked_abspaths = [os.path.join(dirpath, f) for f in untracked_files]

    untracked = []
    for name, abspath in zip(untracked_files, untracked_abspaths):
        lastMod, timeSince = _last_modified_time(abspath)
        untracked.append({ "filename": name, "lastModified": lastMod, "timeSinceModified": timeSince })

    # In order to make sure that we have up to date information, we fetch
    origin_remote, remote_url = _get_remote_origin(repo)
    try:
        origin_remote.fetch()
    except Exception, e:
        print "There was an error fetching from the remote: %s" % str(e)

    # Gather information about unpushed commits
    unpushed_commits = {}

    raw_unpushed_str = repo.git.log("origin/%s..HEAD" % current_branch.name)
    unpushed_hexshas = [line.split(" ")[1] for line in raw_unpushed_str.split('\n') 
            if line.startswith("commit")]
    unpushed_objs = [repo.commit(h) for h in unpushed_hexshas]

    if unpushed_objs:
        previous_commit = unpushed_objs[-1].parents[0] # First parent commit
    else:
        previous_commit = None

    unpushed_commits = []
    for u in unpushed_objs:
        unpushed_commits.append(_commit_to_dict(u, previous_commit))
        previous_commit = u

    # Information about the commits on that branch
    # Grab the commits in reverse chronological order
    # TODO: Deprecate "all commits" when we're sure it's no longer needed
    commits = []
    previous_commit = None  # Find diff relative to previous commit
    for c in repo.iter_commits():
        commit_info = _commit_to_dict(c, previous_commit)
        commits.append(commit_info)
        previous_commit = c

    # Pull statistics from the zsh git plugin (i.e. number of untracked)
    file_stats = gitstatus.get_statistics(dirpath)

    # Unstaged changes for added files (aka git diff)
    try:
        current_diffs_raw = repo.index.diff(None, create_patch=True)
        current_diffs = _difflist_to_dictlist(current_diffs_raw)
    except Exception as e:
        print "There was an error getting `git diff`: %s" % str(e)
        current_diffs = [] 

    working_copy = {
            "computerId": params["computerId"],
            "branchName": current_branch.name,
            "remoteUrl": remote_url,
            "untrackedFiles": untracked,
            "unpushedCommits": unpushed_commits,
            "clientDir": dirpath,
            "gitDiff": current_diffs,
    }
    for k, v in file_stats.iteritems():
        working_copy[k] = v

    return working_copy

def _commit_to_dict(c, previous_commit=None):
    """ 
    Converts a commit object to a dict that we can send to the server i

    Args: 
        c: pygit2 commit object
        previous_commit: another pygit2 commit object, used
            to find a diff
    """
    if previous_commit: 
        current_diffs = c.diff(previous_commit, create_patch=True)
        changed_files = [d.a_blob.name for d in current_diffs if d.a_blob]
        detailed_diffs = _difflist_to_dictlist(current_diffs)
    else:
        detailed_diffs = []  # TODO make this based on the last pushed commit
        changed_files = []

    commit_info = {
            "clientHash": c.hexsha,
            "author": {
                "name": c.author.name,
                "email": c.author.email
            },
            "message": c.message,
            "timestamp": c.committed_date,
            "files": changed_files,
            "diff": detailed_diffs
    }
    return commit_info

def _difflist_to_dictlist(diffs):
    """
    Converts a list of diffs to a list of dicts to send to the server
    """
    dictlist = []
    for diff in diffs:
        # For now, ignore renamed, deleted files from detailed_diffs
        if diff.deleted_file or diff.renamed:
            continue

        # We can take a or b for the two diffs: 
        # take b, since new files don't have an a_blob
        filename = diff.b_blob.name  
        abspath = diff.b_blob.abspath

        current_dict = {
            "file": filename, 
            "content": diff.diff,
        }

        if os.path.exists(abspath):
            lastMod, timeSince = _last_modified_time(abspath)
            current_dict['lastModified'] = lastMod
            current_dict['timeSinceModified'] = timeSince

        dictlist.append(current_dict)
    return dictlist

def _get_remote_origin(repo):
    origin_remote = next((r for r in repo.remotes if r.name == 'origin'), None)
    if not origin_remote:
        print "This tool requires a remote branch named 'origin'"
        sys.exit(1)
    remote_url = origin_remote.url
    return origin_remote, remote_url

def _last_modified_time(abspath):
    """ 
    Get the last modified time and the time since modified of a file at 
    the given path (in milliseconds)
    """
    lastModified = os.path.getmtime(abspath) * 1000
    timeSinceModified = int(time.time() * 1000) - lastModified
    return lastModified, timeSinceModified
