<!-- markdownlint-disable MD013 MD024 MD001 MD045 -->
# Blind accessibility mod for crosscode (WIP)

### Please report all bugs on the [CrossCode Modding](https://discord.com/invite/3Xw69VjXfW) discord

[![Discord](https://img.shields.io/discord/382339402338402315?logo=discord&logoColor=white&label=CrossCode%20Modding)](https://discord.com/invite/3Xw69VjXfW)

## Will it work on my machine?

The mod has support for Windows, Linux, and probably MacOS (untested).  
You need to have a controller to play this mod, as performing numerous tasks without sight is impossible using a keyboard and mouse.  

On Windows, the mod can communicate directly with the [NVDA screen reader](https://www.nvaccess.org/).  

## Installation

If it's your first time modding CrossCode, download the `bundle.zip` from the latest release.  
The bundle contains [the modloader](https://github.com/CCDirectLink/CCLoader), this mod, and all required dependencies.  
Copy it to the main game directory and extract it there.  
There should be a file called `mods.json` and a file named `CrossCode.exe` in the same directory.  

[![Releases](https://github.com/CCDirectLink/organization/blob/master/assets/badges/releases%402x.png)](https://github.com/CCDirectLink/CrossedEyes/releases/latest/)

## Demo version
You can download the demo version with the mod included [here](https://github.com/krypciak/crosscode-demonizer/releases/latest).  
Just pick your platform of choice and make sure the zip has `crossedeyes` at the end.  

## [Tutorial](/TUTORIAL.md)

## Updating

The mod should update automatically, no need to reinstall anything.

## Showcases

- [v0.4.0 on YouTube](https://www.youtube.com/watch?v=ham2pcznMnM)  

# For developers

[![](https://tokei.rs/b1/github/CCDirectLink/CrossedEyes?type=typescript&label=TypeScript&style=flat)](https://tokei.rs/b1/github/CCDirectLink/CrossedEyes?type=typescript&label=TypeScript&style=flat)

## Building

```bash
git clone https://github.com/CCDirectLink/CrossedEyes
cd CrossedEyes
pnpm install
pnpm run start
# this should return no errors (hopefully)
npx tsc
```
