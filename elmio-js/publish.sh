#!/bin/bash

main() {
    local version
    version=$(get_version "$1")
    echo "New version: $version"

    check_git_clean

    pnpm build

    set_version "$version"

    commit_and_push

    npm login

    npm publish --access public --tag latest
}

get_version() {
    local version="$1"
    if [[ -z "$version" ]]; then
        jq -r '.version' package.json
    else
        echo "$version"
    fi
}

check_git_clean() {
    if [[ -n $(git status --porcelain) ]]; then
        echo "Uncommitted files detected. Aborting release."
        exit 1
    fi
}

set_version() {
    local version="$1"
    jq --arg version "$version" '.version = $version' package.json >package.json.tmp
    mv package.json.tmp package.json
}

commit_and_push() {
    git add .
    git commit -m "Publishing package"
    git push
}

main "$@"
