<!-- markdownlint-disable MD013 MD024 -->

# Change Log

## [Unreleased]

### Added

- Added an aim bounce help entry to the analysis menu
- Added announcing of CCModManager mod testing status
- Added an option that disables the player idle animation (on by default)

### Changed

- Renamed the "CrossedEyes" options category to "Functionality" and moved it to the bottom of the list

### Fixed

- Fixed options of some mods (dmitmel tweak pack) not being announced
- Fixed aim bounce turning on when entering the analysis menu
- Fixed entity beeping sounds persisting even after their death
- Fixed unnamed NPC names being announced as MISSING LABEL
- Fixed aim analysis hint selection persisting when entering the quick menu
- Fixed hint selecting persisting after the upgrade field in Rhombus Dungeon was used
- Fixed sound selection persisting after switching categories in the Sound Glossary
- Made the demo version compatible again

## [0.6.0] 2024-04-20

### Added

- Added aim bounce end hint whitelist
- Added basic inventory menu support
- Added Y level coordinate announcing (more info in the quick menu help pages)

### Changed

- Also announce the body part in the equipment menu

### Fixed

- Fixed equipment menu items not updating after equipping something new
- Bump NVDA addon version to the latest available
- Fixed awful typos all over the place
- Removed duplicate quick menu analysis help menu entry

## [0.5.9] 2024-03-27

### Added

- Added ball changer hint
- Added hint filtering for battle regions
- Added puzzle skipping help page

### Changed

- Footstep sounds now play even if not running
- Puzzle filtering is now called selection filtering
- Puzzle filtering now only takes effect when the puzzle is not solved

### Fixed

- Fixed map name not getting announced when switching maps
- Fixed NVDA addon not working
- Fixed footstep and wall collision sounds not playing while aiming
- Fixed character name being repeated after they already said something
- Fixed hint selection persisting even after the entity disappeared
- Fixed custom quick menu buttons not getting announced

## [0.5.8] 2024-03-13

### Added

- Moved mod auto-updating to CCModManager
- Added CCModManager support (go to the options menu and press Gamepad Y)
- Added "Button denied" sound to the sound glossary
- Added equipment menu support
- Added quick menu item sub menu support
- Added analysis menu help menu
- Added quick menu help menu
- Added a mod icon

### Fixed

- Fixed minor punctuation errors at the end of sentences

## [0.5.7] 2024-02-06

- Added a few puzzle elements to sound glossary
- Added info sign hint
- Added tutorial pop-ups announcing
- Added hint filtering to only show the hints relevant to the puzzle
- Added puzzle skip button to the quick menu

### Fixed

- Fixed auto updater not working (you have to update to this version manually)
- Mod version should be announced properly now

## [0.5.6] 2024-02-04

### Added

- Announce walking onto hints
- Added received item announcing
- Add "Floating Moving Platform" puzzle entity hint

### Fixed

- Properly center the interactable sound
- Fix crash at entering rhombus dungeon (again)
- A lot of cargo boxes were falsly detected as climbable

## [0.5.5] 2024-01-31

### Added

- Added "Moving Block" puzzle entity hint
- Added "Chest" hints
- Added hint for the "upgrade field"
- Added help menu tts support
- Added full mod multi-language support
- Added sound glossary help menu

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

- Added back a necessary missing container from Cargo Hold 3
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
- Fix deck tutorial target bot not being a hint
- Don't say the map name when it's missing

## [0.5.2] 2024-01-15

### Added

- Added TUTORIAL.md to bundle.zip as CROSSEDEYES_MANUAL.md
- Removed useless clutter (cargo boxes) from early maps to make them easier and less annoying

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
- Added hints for props that lead to higher places
- Add wall scan aim mode
- Automatically determine NVDA text speed to adjust dialogue beeping sounds
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
- Fix wall sounds being slightly behind when the player is moving
- Fix L1 not selecting a hint on analysis screen entry

## [0.5.0] 2024-01-06

### Added

- Added a ball bounce prediction system

### Changes

- Up/down sounds now don't require a jump to trigger
- Limit uploaded game log size to 3000 lines
- Add delay to game log upload
- Enemy level has been moved to the R2 description

### Fixes

- Wall and jump hint sounds are not on anymore when the player is floating
- Fixed enemies emitting sounds after death
- Deactive toggled hints when the entity is killed
- Fix gradual game slowdown
- Fixed NVDA plugin?? (maybe)

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

- Added a note in README about os support and the controller requirement
- Say `uploading` immediately after pressing the F4 keybinding
- Add save/load menu tts
- Added text being toggle
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

- README improvements.
- Side character messages now end with the speech end.
- Side character messages don't have a beeping text sound anymore.
