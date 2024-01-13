#!/bin/bash

blitzkrieg_version="$(jq '.dependencies["cc-blitzkrieg"]' ccmod.json | tail -c +4 | head -c -2)"
blitzkrieg_url="https://github.com/krypciak/cc-blitzkrieg/releases/download/v${blitzkrieg_version}/cc-blitzkrieg-${blitzkrieg_version}.ccmod"

inputapi_url='https://github.com/CCDirectLink/input-api/releases/download/v1.0.1/input-api.ccmod'
ccloader_url="$(curl -s 'https://api.github.com/repos/CCDirectLink/CCLoader/releases/latest' | jq '.tarball_url' | head -c -2 | tail -c +2)"

mkdir -p pack/assets/mods
[ ! -f pack/assets/mods/cc-blitzkrieg* ] && wget "${blitzkrieg_url}" -O "pack/assets/mods/cc-blitzkrieg-${blitzkrieg_version}.ccmod"
[ ! -f pack/assets/mods/input-api* ] && wget "${inputapi_url}" -O 'pack/assets/mods/input-api.ccmod'
cp crossedeyes*.ccmod pack/assets/mods/

[ ! -f pack/ccloader.tar.gz ] && wget "${ccloader_url}" -O pack/ccloader.tar.gz
tar -xf pack/ccloader.tar.gz --directory=pack
cp -r pack/*CCLoader*/* 'pack/'
rm -rf pack/*CCLoader*
rm -rf pack/ccloader.tar.gz

patch -p1 pack/package.json < .github/workflows/package.patch

cp ./TUTORIAL.md pack/CROSSEDEYES_MANUAL.md

cd pack
rm -rf ../bundle.zip
zip -r ../bundle.zip *
cd ..
rm -rf pack
