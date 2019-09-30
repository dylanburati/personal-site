#!/bin/sh
MSG="gatsby-site: $(git log --no-decorate --oneline | head -n 1 | sed 's/^[0-9a-f]\+ //' | tr -d '[:cntrl:]')"

./node_modules/.bin/gh-pages -d public \
    --repo "git@github.com:dylanburati/dylanburati.github.io.git" \
    --branch master \
    --message "$MSG"
