#!/bin/bash

set -e
MOD_URLS=(
    "cc-blitzkrieg" "https://github.com/krypciak/cc-blitzkrieg/releases/download/v@VERSION/cc-blitzkrieg-@VERSION.ccmod"
    "input-api" "https://github.com/krypciak/input-api/releases/download/v1.0.2/input-api.ccmod"
    "ccmodmanager" "https://github.com/CCDirectLink/CCModManager/releases/download/v@VERSION/ccmodmanager-@VERSION.ccmod"
    "nax-ccuilib" "https://github.com/krypciak/nax-ccuilib/releases/download/v1.2.5/nax-ccuilib.ccmod"
    "nax-module-cache" "https://github.com/krypciak/nax-module-cache/releases/download/v1.0.2/nax-module-cache.ccmod"
)
mkdir -p pack/assets/mods
for ((i = 0 ; i < ${#MOD_URLS[@]} ; i+=2)); do
    name=${MOD_URLS[$i]}
    url=${MOD_URLS[$i+1]}
    version="$(jq ".dependencies[\"${name}\"]" ccmod.json | tail -c +4 | head -c -2)"
    url=$(echo $url | sed "s/@VERSION/${version}/g")
    echo -e "\n----------------Downloading $name v$version"
    [ ! -f "pack/assets/mods/${name}"* ] && wget -nv "$url" -O "pack/assets/mods/$name.ccmod"
done

cp crossedeyes*.ccmod pack/assets/mods/

echo -e "\n----------------Downloading CCLoader"
ccloader_url="$(curl -s 'https://api.github.com/repos/CCDirectLink/CCLoader/releases/latest' | jq '.tarball_url' | head -c -2 | tail -c +2)"
[ ! -f pack/ccloader.tar.gz ] && wget -nv "${ccloader_url}" -O pack/ccloader.tar.gz
tar -xf pack/ccloader.tar.gz --directory=pack
cp -r pack/*CCLoader*/* 'pack/'
rm -rf pack/*CCLoader*
rm -rf pack/ccloader.tar.gz

patch -p1 pack/package.json < .github/workflows/package.patch

cp ./TUTORIAL.md pack/CROSSEDEYES_MANUAL.md
rm pack/mods.json

cd pack
rm -rf ../bundle.zip
zip -r ../bundle.zip *
cd ..
rm -rf pack
