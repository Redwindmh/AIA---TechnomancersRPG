# Echoes of the Wildgear

> A small, original browser JRPG battle prototype set in the moonlit ruins of Chronovale.

**Project status:** Work in progress  
**Current prototype version:** 0.3.0  
**Last updated:** October 30, 2026

Echoes of the Wildgear is a dependency-free HTML, CSS, and JavaScript game prototype. The current build focuses on a polished, repeatable turn-based battle: choose commands, manage HP and TP, defeat an increasingly dangerous Wildgear, and continue the run until Lyra falls.

The game takes broad inspiration from the energy and readability of 1990s time-travel JRPGs while using an original world, characters, interface, artwork, music, and enemy designs.

## Play now

The fastest option is to open `index.html` in a modern browser.

For the most reliable local experience, serve the folder through a small HTTP server:

```sh
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

If you use Visual Studio Code, you can also open this directory and launch `index.html` with a local-server extension such as Live Server.

No package installation, build command, account, API key, or internet connection is required after the project files are present.

## Installation

### Option 1: Download or copy the project

1. Place the project folder anywhere on your computer.
2. Confirm that `index.html`, `styles.css`, `game.js`, and the `assets/` directory remain together.
3. Open `index.html` directly, or start one of the local servers described above.

### Option 2: Clone with Git

When this project is hosted in a Git repository:

```sh
git clone <repository-url>
cd TechnomancersGuild
python3 -m http.server 8000
```

Replace `<repository-url>` with the eventual repository address.

## How to play

Each round begins on Lyra's turn. Select one command, watch the action resolve, and prepare for the enemy response. A battle ends when either combatant reaches 0 HP.

### Controls

| Action | Keyboard | Mouse / touch |
| --- | --- | --- |
| Attack | `A` | Select **Attack** |
| Open Arts | `S` | Select **Arts** |
| Guard | `D` | Select **Guard** |
| Use Moon Tonic | `F` | Select **Item** |
| Leave the Arts menu | `Esc` | Select **Back** |
| Toggle audio | — | Select **Sound on/off** |

On phones and tablets, every battle command is available as a touch target. No keyboard is required.

### Battle commands

| Command | Effect |
| --- | --- |
| **Attack** | Deals 19–28 base damage and restores 2 TP. |
| **Arts** | Opens Lyra's temporal techniques. Arts are stronger or restorative, but cost TP. |
| **Guard** | Reduces the next enemy hit to roughly 35% damage and restores 4 TP. |
| **Item** | Uses one Moon Tonic to restore up to 50 HP. Lyra begins each encounter with two. |

### Temporal Arts

| Art | Cost | Effect |
| --- | ---: | --- |
| **Arc Slash** | 6 TP | A heavy saber strike dealing 33–43 base damage. |
| **Spark Lance** | 10 TP | Deals 47–58 base damage and has a 35% chance to disrupt the enemy's next turn. |
| **Time Mend** | 8 TP | Rewinds Lyra's wounds, restoring 34–45 HP. |

Lyra begins each encounter with 120 HP and 20 TP. Basic attacks and guarding replenish TP, so alternating offense and recovery is more reliable than spending every Art immediately.

### Winning, losing, and continuing

- Defeat the enemy to record a run victory and unlock the next encounter.
- Later encounters have more HP, deal more damage, and cycle through new Wildgear titles.
- Lyra's HP, TP, and Moon Tonics reset at the start of each encounter.
- If Lyra falls, select **Rewrite the battle** to retry the current encounter.
- Run progress is currently stored only in memory and resets when the page refreshes.

## Backstory

Long before the present age, the artificers of Chronovale built the **Wildgear**—clockwork guardians designed to protect the living forest and stabilize the flow of time around it. When Chronovale vanished in a single moonless night, its guardians were left behind without masters or memory.

Centuries later, fractures called **echoes** began appearing throughout the valley. Moments repeated. Ruins rebuilt themselves and collapsed again. Travelers met older versions of themselves on roads they had not yet taken. With each fracture, the Wildgear grew more aggressive, stitching moss, stone, and ancient machinery into new predatory forms.

**Lyra**, a young Time Wanderer carrying a saber forged from a broken astrolabe, can hear the rhythm beneath these distortions. She enters the Twilight Wilds searching for her missing mentor and the source of the signal pulsing from Chronovale's central tower.

The Ruinmaw guarding the first clearing is only an outer sentinel. Every victory carries Lyra deeper into a timeline that may already remember her defeat.

## Audio

The soundtrack and effects are synthesized at runtime with the browser's Web Audio API:

- a looping chiptune-style melody and bass line;
- a filtered sword-swing sound for attacks;
- a separate low impact sound for collisions;
- menu, healing, victory, and defeat cues.

Browsers require a user interaction before audio can begin. The BGM therefore starts when the player selects the first command. The **Sound** control mutes or restores both music and effects.

## Mobile support

The battle interface adapts for desktop, tablet, and phone layouts:

- the status and command panels stack vertically on smaller screens;
- the battlefield reframes the combatants for portrait-oriented displays;
- main commands use a two-column touch layout, falling back to one column on very narrow devices;
- the Arts menu becomes a single readable column on phones;
- labels, health meters, combat messages, and result controls remain touch-accessible.

The intended minimum viewport width is 320 CSS pixels.

## Project structure

```text
.
├── index.html              # Battle screen markup
├── styles.css              # Layout, responsive rules, and animation
├── game.js                 # Battle logic, input, effects, and procedural audio
├── README.md               # Canonical setup, play, story, and status guide
├── AGENTS.md               # Maintenance instructions for future contributors
└── assets/
    ├── lyra.png            # Player character artwork
    ├── ruinmaw.png         # Wildgear enemy artwork
    └── ruins-clearing.png  # Battle background
```

## Development

The project deliberately uses browser-native technologies and has no dependency installation step.

After editing:

1. Run a JavaScript syntax check:

   ```sh
   node --check game.js
   ```

2. Serve the directory locally.
3. Test Attack, each Art, Guard, Item, victory, defeat, audio toggle, and rematch.
4. Check at least one desktop viewport and phone widths around 390 and 320 CSS pixels.
5. Update this README when behavior, controls, setup, balance, story, assets, or the roadmap changes.

## Roadmap

This is a working prototype, not a finished game. Likely future directions include:

- additional playable party members and combo Arts;
- multiple enemy sprites, behaviors, and elemental weaknesses;
- a proper active-time or initiative system;
- exploration between encounters;
- persistent settings, progression, and save data;
- accessibility options for motion, contrast, audio levels, and input remapping;
- original composed music tracks and expanded sound design;
- narrative scenes, dialogue, and additional Chronovale locations;
- automated browser tests for battle-state regressions.

Roadmap items are ideas rather than promises and may change as the prototype evolves.

## Keeping this README current

`README.md` is the canonical project guide. Any change that affects installation, controls, combat rules, balance, audio, responsive behavior, file structure, story, project status, or planned work should update the relevant section in the same change.

When making a meaningful release-style update:

1. update **Current prototype version**;
2. update **Last updated**;
3. revise the relevant feature and gameplay sections;
4. move completed roadmap work into the documented current feature set;
5. verify that commands and file paths still work as written.

## Credits and asset notes

- Game concept, setting, characters, interface, and code are original to this prototype.
- The three raster game assets were generated specifically for this project with OpenAI's built-in image generation tooling, then integrated locally.
- The project does not include copied sprites, music, code, characters, or locations from any commercial game.

