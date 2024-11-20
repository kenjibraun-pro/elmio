#!/bin/bash
set -e

env="$1"
event="$2"
target="debug"

if [[ "$env" == "release" ]]; then
    target="release"
fi

if [[ "$event" == "after_asset_hash" || "$env" == "dev" ]]; then
    # Generate html
    ./target/$target/counter_cli home_page >dist/index.html
    echo "Not found" >dist/404.html
fi
