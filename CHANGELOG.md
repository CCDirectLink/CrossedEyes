<!-- markdownlint-disable MD013 MD024 -->

# Change Log

## [Unreleased]

### Added

- Added "Moving Block" puzzle entity hint
- Added "Chest" hints

### Changed

- Increased interactable volume slider maximum to 3
- Fix some entities being falsly treated as interactables (again)

### Fixed

- Fixed crash at entering rhombus dungeon
- Fixed hints not unfocusing when focused and the filter is changed

## [0.5.4] 2024-01-27

### Added

- Added level up tts announcing
- Added sound glossary
- Added hints for instant matter objects in Cargo Hold 1

### Fixed

- Added back a nessesery missing container from Cargo Hold 3
- Fix some entities being falsly treated as interactables

## [0.5.3] 2024-01-22

### Added

- Added interactable volume slider
- Added entity hints volume slider
- Enemy hint sounds, jump hint sounds, entity hint sounds and hint sounds are now pitched down when they're behind the player
- Add dash volume slider
- Added enemy vulnerability multiplier slider (for now only the crab boss is implemented)
- Make the escape sequence (after defeating the crab boss) a bit easier
- Add mod auto-update toggle

### Changes

- TTS should now initialize faster

### Fixed

- Fix potential crash on jump
- Fix deck tutorial target bot not beaing a hint
- Don't say the map name when it's missing

## [0.5.2] 2024-01-15

### Added

- Added TUTORIAL.md to bundle.zip as CROSSEDEYES_MANUAL.md
- Removed useless clutter (cargo boxes) from early maps to make them easier and less annyoing

### Fixes

- Fixed some tutorial spelling mistakes
- Unfocus hints when they no longer can be focused
- Fix possible crash at game load
- Fixed selected hints bugging out when more than one hint is selected
- Fix wall, jump hint and hint sound not respecting global sound volume
- Fix crash at Cargo Ship - Cabins 1

## [0.5.1] 2024-01-12

### Added

- Added jump volume slider
- Added hints for props that lead to higher palces
- Add wall scan aim mode
- Automaticly determine NVDA text speed to adjust dialogue beeping sounds
- Added wall bump volume slider
- Added destination map on doors and paths
- Added a simple text tutorial

### Changes

- Footstep volume now also plays if you only collide with walls only slightly
- Changed hint name from "Teleport Ground" to "Path"

### Fixes

- Fix options menu getting interrupted for after entering while in-game
- Fix some mod sounds persisting indefinitely
- Fix aim bounce toggling when entering the quick menu (for some people)
- Fix wall bumping not working on diagonal walls
- Fix wall sounds glitching on corners
- Fix wall sounds beaing slightly behind when the player is moving
- Fix L1 not selecting a hint on analysis screen entry

## [0.5.0] 2024-01-06

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
- Improve demo compatibility

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
