<!-- markdownlint-disable MD013 MD024 -->

# Change Log

## [Unreleased]

### Added

- Added a ball bounce predition system

### Changes

- Up/down sounds now don't require a jump to trigger
- Limit uploaded game log size to 3000 lines
- Add delay to game log upload
- Enemy level has been moved to the R2 description

### Fixes

- Wall and jump hint sounds are not on anymore when the player is floating
- Fixed enemies emmiting sounds after death
- Deactive toggled hints when the entity is killed
- Fix gradual game slowdown
- Fixed NVDA plugn?? (maybe)

## [0.4.9] 2023-12-29

### Added

- Added in game settings to the F4 log
- Add volume sliders for walls, jump hints and hints
- Make the language selection a list instead of a 2x3 grid

### Fixes

- Hint selection in the analysis screen should no longer spam selections
- Sound of hitting enemies is now always consistent

## [0.4.8] 2023-12-27

### Added

- Announce mod version on startup
- Flag Doors, Teleport Grounds and Teleport Fields as visited after going through them
- Say 'new' when entering a previously undiscovered map
- Also upload NVDA log on F4
- Add enemy hints

### Fixes

- Fixed game slowdowns, freezes and crashed caused by infinite sound handle stacking
- Fixed NVDA plugin crash

## [0.4.7] 2023-12-21

### Added

- Added a note in README about os support and the controller requiremenet
- Say `uploading` immediately after pressing the F4 keybinding
- Add save/load menu tts
- Added text beeing toggle
- Announce map name when switching maps

### Fixes

- NVDA addon should correctly install now for all users (hopefully)

## [0.4.6]

### Added

- Press F4 to upload to a pastebin like site and copy the link to clipboard

### Fixes

- Fixed NVDA addon installing and mod auto-updating

## [0.4.5]

### Added

- Added changelog
- When using a dualshock controller, proper button names are said (instead of xbox ones)

### Changes

- README improvments.
- Side character messages now end with the speech end.
- Side character messages don't have a beeping text sound anymore.
