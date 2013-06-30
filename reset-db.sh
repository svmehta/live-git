#!/bin/bash
# Run this as: ../reset-db.sh (from inside the meteor-live-git directory!)

echo "db.commits.drop(); db.computers.drop(); db.repositories.drop(); db.users.drop(); db.workingCopies.drop();" | meteor mongo

rm ~/.gitdashboard/watcher_config

