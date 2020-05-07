#!/bin/bash

# Starts an in-memory mongodb instance, sets up service provider
# categories/subcategories, and starts a dev server connected to
# the in-memory db

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# start the in-memory mongodb instance
node "${DIR}/../../cypress/start_memory_db.js"

# get the pid and uri of the mongodb instance
read -r MONGODB_PID <"${DIR}/../../cypress/.mongodbpid"
read -r MONGODB_URI <"${DIR}/../../cypress/.mongodburi"

CATEGORY_SETUP_SCRIPT="${DIR}/../../__build__/setupCategories.js"
USER_SETUP_SCRIPT="${DIR}/../../__build__/bin/add_test_users"

# see if the category setup script exists, if not, build it
if ! test -f "$CATEGORY_SETUP_SCRIPT"; then
    yarn workspace @upswyng/upswyng-server rollup --config data-pipeline.rollup.config.js
fi

# setup categories
DATABASE_URL=$MONGODB_URI DATABASE_NAME="" DATABASE_USER="" DATABASE_PASSWORD="" \
    node $CATEGORY_SETUP_SCRIPT

# see if the user setup script exists, if not, build it
if ! test -f "$USER_SETUP_SCRIPT"; then
    yarn workspace @upswyng/upswyng-server rollup --config data-pipeline.rollup.config.js
fi

# add test users
DATABASE_URL=$MONGODB_URI node $USER_SETUP_SCRIPT

# start server
DATABASE_URL=$MONGODB_URI DATABASE_NAME="" DATABASE_USER="" DATABASE_PASSWORD="" PORT=43637 \
    yarn workspace @upswyng/upswyng-server dev
