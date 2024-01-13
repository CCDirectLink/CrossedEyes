<!-- markdownlint-disable MD013 MD024 -->
# Small and quick temporary CrossedEyes manual

CrossCode is an action rpg with a two-dimensional top-down perspective.  
This mod only supprots contollers.  
You cannot play this game without sight on a keyboard.  

In the following guide I will be using xbox key names.  
Xbox to playstation buttons:

- Y is the triangle
- B is the circle
- A is the X
- X is the square
- L1 is the left bumper
- L2 is the left trigger
- L3 is the left analog stick button
- R1 is the right bumper
- R2 is the right trigger
- R3 is the right analog stick button

## Navigating the world

You move with the left stick.

### Wall sounds

Walls make continous noise with volume depending on how close they are to the player.  
Only 4 directions are checked: north, south, east and west.  

[Sound: Wall](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/wall.ogg)  

### Wall bumping sounds  

When you collide with a wall, a bumping sound is played.  
It's volume depends on how much velocity is lost by the collision.

### Jump hints  

For 8 directions around the player different sound cues can play depending on certain conditions:

- There's a platform you can jump onto across a hole. [Sound](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/land.ogg)  
- You can gain height. [Sound](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/higher.ogg)  
- You can lose height. [Sound](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/lower.ogg)  
- You fall into water.

### Entity sounds  

Certain entities emit sound.  
For example:
  
- [Enemies](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/entity.ogg)
- Destructibles (same sound as for enemies)
- Switches (same sound as for enemies)
- [Doors and paths](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/tpr.ogg)  

All mod settings are in the assists options category.  
You can adjust the volume of all mod sound cues.  
You can adjust the volume of footsteps and jumping in the options.  

### Interactables

Some entities are interactable. For example:

- Some NPCs
- Elevators

[Sound: Interactable is nearby](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/interactable.ogg)  
[Sound: Press A to interact](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/interact.ogg)  

## Aiming

You aim with the right stick.  
You can aim the whole 360 degrees around the player.  
Aiming can often require a lot of precision.  
You can shoot balls with R1.  
At first, balls cannot be charged.  
After the charge mode is activated, you can hold your aim for a longer time until you hear a sound.  
Charged balls can bounce off walls and are used a lot in puzzles.  

## The hint system

Hints tell you about what things are around you.  
A lot of entities have hints attached on them, for example:

- NPCs
- Puzzle elements
- Map entrances/exits
- Enemies
- Terrain hints

[Sound: hint is focused](https://github.com/krypciak/test/raw/main/assets/media/sound/crossedeyes/hint.ogg)

To access the hints, you need to open the quick menu with L2.  
To open the analysis menu from there you go right with the left stick and press A.  
Navigate through and focus the hints from closest to furthest with L1 and R1.  
When a hint is focused, you can press L3 to read the hint description.  
When a hint is focused, you can select it with X.  
Selecting a hint makes the focus persist even outside of the analysis menu.  
Hints have higher pitch if they are higher than the player, and lower pitch if they are lower.  
You can filter hints by type using dpad left and dpad right.  

### Aim analysis

To activate aim analysis, be in the analysis menu and press Y.  
Press it again to deactivate it.  
When it's activated, hints that you directly aim at will be focued.  
The hint will be unfocused when you aim away.  

#### Aim bounce

To activate aim bounce, be in the analysis menu and press A.  
Press it again to deactivate it.  
Aim bounce only does something when charge mode is enabled and aim analysis is active.  
This mode simulates the ball bouncing off walls and puzzle elements.  
It says what the ball bounced off, and it focuses the last hint the ball hit.

## Wall scanning

To activate wall scanning, be in the quick menu and press Y.  
Press it again to deactivate it.  
Aiming now will play a sound at the wall you aimed at.  
This will also mute wall sounds and jump hint sounds.  
