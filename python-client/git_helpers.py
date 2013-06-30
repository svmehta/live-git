#!/usr/bin/env python
"""

"""

from git import *
import os, sys

def get_info():
    # Scripting part (move into main() etc functions later)
    cwd = os.getcwd()
    git_directory = os.path.join(os.getcwd() + "/.git/")

    if not os.path.exists(git_directory):
        print "We couldn't find a .git/ directory in the current working directory. Are you in the root of the git repository?"
        sys.exit(1)    
    elif not os.path.isdir(git_directory):
        print "We found a file named .git/, but it should be a directory."
        sys.exit(1)

    repo = Repo.init(cwd)

    results = {}

    # Computer (user information)
    config = repo.config_reader()
    user_name = config.get_value("user", "name")
    user_email = config.get_value("user", "email")

    computer = {
        "user": {
            "name": user_name,
            "email": user_email
        }
    }

    results["computer"] = computer

    # Branch 
    current_branch = repo.active_branch
    untracked = repo.untracked_files

    # Remotes
    raw_remotes = repo.remotes

    # Information about the commits on that branch
    # Grab the commits in reverse chronological order
    commits = []
    previous_commit = None  # Find diff relative to previous commit
    for c in repo.iter_commits():
        current_diffs = c.diff(previous_commit, create_patch=True)
        changed_files = [d.a_blob.name for d in current_diffs]
        detailed_diffs = []

        for diff in current_diffs:
            # For now, ignore renamed, deleted
            if diff.deleted_file or diff.renamed:
                continue
            # TODO exclude binary files (like images)

            # We can take a or b for the two diffs: 
            # take b, since new files don't have an a_blob
            filename = d.b_blob.name  
            detailed_diffs.append({
                "filename": filename, 
                "content": diff.diff }
                )

        commit_info = {
                "hash": c.hexsha,
                "author": {
                    "name": c.author.name,
                    "email": c.author.email
                },
                "message": c.message,
                "timestamp": c.committed_date,
                "files": changed_files
        }

        commits.append(commit_info)
        previous_commit = c

    working_copy = {
            "timestamp": "TODO",  # TODO record last time sent from client
            "branchName": current_branch.name,
            "untrackedFiles": untracked,
            "commits": commits,
            "clientDir": cwd
    }

    results["workingCopy"] = working_copy

    print results
