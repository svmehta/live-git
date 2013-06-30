#!/bin/bash
#
# /etc/init.d script for deployment
#
# Deploy with: sudo ln -s /var/www/live-git/deployment/init-script.sh /etc/init.d/live-git
# Based on: http://pau.calepin.co/how-to-deploy-a-nodejs-application-with-monit-nginx-and-bouncy.html
#

DIR=/var/www/live-git
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
METEOR=/usr/local/bin/meteor

PIDDIR=/var/run/live-git
LOGDIR=/var/log/live-git

if [ ! -x $METEOR ]
  then echo "meteor binary not found, or not executable" && exit 1
fi

if [ ! -w $PIDDIR ]
  then echo "missing pidfile directory, or cannot write: $PIDDIR" && exit 1
fi

if [ ! -w $LOGDIR ]
  then echo "missing logfile directory, or cannot write: $LOGDIR" && exit 1
fi


function start_app {
  echo "Starting live-git server, output to: $LOGDIR/server.log"
  cd DIR
  NODE_ENV=production nohup "$METEOR" run --production 1>>"$LOGDIR/server.log" 2>&1 &
  echo $! > "$PIDDIR/server.pid"
}

function stop_app {
  echo "Stopping live-git, server pid:" `cat $PIDDIR/server.pid` "crawl monitor pid:" `cat $PIDDIR/crawl-dispatch.pid`
  kill `cat $PIDDIR/server.pid`
  kill `cat $PIDDIR/crawl-dispatch.pid`
}


case $1 in
   start)
      start_app ;;
    stop)
      stop_app ;;
    restart)
      stop_app
      start_app
      ;;
    *)
      echo "usage: /etc/init.d/live-git {start|stop}" ;;
esac
exit 0