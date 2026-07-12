#!/bin/bash
mkdir -p /data/database
mkdir -p /data/cards

if [ ! -f /data/database/cards.db ] && [ -f database/cards.db ]; then
    cp database/cards.db /data/database/cards.db
fi

rm -rf database public/cards
ln -sf /data/database database
ln -sf /data/cards public/cards

node server.js
