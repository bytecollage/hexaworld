# Game behavior — hexaworld

Living document: it describes the game rules as they are implemented. **Update it with every change.**
For how the code is organized (and how to add or remove a species or plant), see [ARCHITECTURE.md](ARCHITECTURE.md).

Last update: 2026-11-26 (jaguars and caimans struggling with their preys and with the character instead of killing at once, character health, fighting back with the knife or the axe, a bigger continent and islands reachable on foot over shallow water, performance panel with thread load, time per system, objects and memory, containers without a close button and their icon at the right above the basket's, chests that last 2 years, traps lit up under the mouse, piles fully visible without a shadow, Ctrl+click with the hand on container slots, stack limits per slot, a live animal per slot, animals drawn as on the map, piles with their icon, the hut instead of the house, a black screen while sleeping, dying without losing the world, vultures pecking, cages that last 2 years and grow to 10 slots, traps that break after 5 catches and lose their animal after a day, caimans that can be hunted, materials of an open chest or the house counting for crafting, wildfire with the torch, using the hand on the inventory, Ctrl+click repeating any gathering, branches from adult trees, small world while developing (radius 100), basket slots inside the inventory, Ctrl+click to repeat, frogs and turtles caught alive, the knife cutting tall grass and branches, construction icon, loading hexagon turning from the start). Earlier, 2026-11-25 (prey remembering where a predator was, skill tree for crafts and builds, fences needing rope and an axe or a knife, jaguars and caimans attacking when bothered 3 times in a day, loading screen, no empty workshop ladder, animals going around the character instead of fleeing, foxes moving out of its way, jaguars watching it and chasing foxes off).

Earlier: 2026-11-24 (finer grid with one element per cell, placing builds by marking a cell, fences by posts, wear of what is built, house lifespan, wind, calmer animals, prey reacting to predators, gulls, vultures that search and land, Next day button).

---

## 1. Time

- **A day lasts 6 real minutes** at ×1 speed.
- **Day phases:** day → dusk → night (their length depends on the season).
- **Clock** (top left):
  - shows the phase, "Day N" and the season icon;
  - on hover: season, day within the season (1-5) and year.
- **Speed control** ("Time" row of the options popup, **O** key): ×1, ×5, ×20, ×60, ×240.
  - Speeds up everything: clock, needs, plants, and animal movement and waits.
- **Next day** button (same row): the **screen goes black**, only the clock is seen moving on, and the world runs without drawing until the next dawn (everything keeps happening, also at night: outdoors in the dark a jaguar can still find you).
  - At high speed, animals are simulated in short steps (max. 1.5 game seconds) so chases keep working.
  - The character is not sped up.
- **Every new world** starts on Day 1, in spring, at dawn.

## 2. Seasons

4 seasons of 5 days: **a year = 20 days**.

| Season | Day | Dusk | Night | What happens |
|---|---|---|---|---|
| 🌸 Spring | 50% | 15% | 35% | Trees grow (from year 2). Bushes with fruit. Almost all animals are born. Tall grass spreads. Immigrants arrive if needed. Beehives split. |
| ☀️ Summer | 62% | 12% | 26% | Bushes with fruit. Fruit trees and palms drop fruit. Turtle nests, crabs and caimans. Second rabbit litter. |
| 🍂 Autumn | 45% | 17% | 38% | Every day 20% of the bushes empty. Some pines sow next to them. |
| ❄️ Winter | 33% | 14% | 53% | Empty bushes. Old trees die. Some tall grass and flower tufts dry up. Beehives without flowers die. Animals get hungrier. |

## 3. World

- **Shape:** a big hexagon of hexagonal cells that repeats on its 6 sides (no edges or poles). Radius **100** cells for now (about 30,000 cells): small while the game is being developed, so tests run fast; the final size will be chosen later.
- **There is always a lake:** if the land comes out without one, a lake is dug at the spot farthest from the sea (land animals need it to drink; without it none would be placed).
- **Cells are small:** about the size of a tall grass tuft or a bush. Distances in this document are in **reference cells** (2.5 cells each), the size the cells used to have; species speeds, sight, fire light and the like are measured in them.
- **Geography:** a big central continent (round with an irregular coast, covering **about half to two thirds of the map**: each world a bit different), the sea as a ring around it, exactly **two small islands** out in that ring and inland lakes (water not connected to the sea). Each island is joined to the continent by a **shelf of shallow water**, so it can be **reached on foot** (wading). The two islands are always far apart (also across the edge, where the world wraps).
- **Terrains:**

| Terrain | Where | Character |
|---|---|---|
| Ocean | open sea | cannot enter |
| Medium depth | about 3-6 reference cells past the coastal strip (irregular edge) | cannot enter |
| Shallow water | 2 reference cells along the coast, the shelves to the islands and all lakes | wades in, slower |
| Sand (beach) | land next to water | walks slower |
| Grass | the rest of the land | walks fast |

- **Outcrops:**
  - rock mound or monolith on a roundish, irregular patch of rocky ground (about 20 cells), on grassland far from water;
  - cannot be crossed;
  - always have loose stones in 4 cells around them.
- **Smooth borders:** where two terrains meet (grass, sand, shallow, medium and deep water, rocky ground) the border is drawn in soft curves, not along the hexagons; the depth bands of the sea wobble instead of following straight lines.
- **One element per cell:** each cell holds **a single element** (a pine, a tall grass tuft, a fruit, a nest, a burrow, a post…), near its center. So a click on a cell always means one thing. Fruit that falls from a tree lands in a free cell beside it; the plants born from a carcass each take a cell around it.
- **Fill inventory** (🧪 button in the options popup, for testing): tops up the inventory to **a full slot (20) of each natural resource** (wood, stones, grass, berries, flowers, fruit, coconuts, pine cones, hides and bones), without changing the map.
- The **test map** (radius 60, a guaranteed lake, a single tall grass tuft, 10 deer and a few small mammals, no predators) is no longer in the game's menu: only the verification tools use it.
- **Fast** (checkbox in the options popup, for testing only; off by default): every job (gathering, crafting, building, chopping, sowing, feeding a fire…) finishes instantly instead of taking its time. Walking is not affected.
- **Terrain brushes** (also in the options popup): Shift+1 ocean, Shift+2 medium, Shift+3 shallow, Shift+4 sand, Shift+5 grass (Shift+0 = move). Painting clears whatever was in the cell and recomputes shores and lakes.

## 4. Character and interface

- **The computer stays awake** while the game is open and visible: no screensaver, sleep or lock screen (where the browser supports it: Chrome, Edge, Safari). When you switch to another tab or window it lets the computer sleep again, and asks again when you come back.
- **Loading screen:** while the page loads, and while a new world is generated, a "Loading…" screen covers everything; the clock, the map buttons and the world appear together when the first frame is drawn, and then the workshop ladder (if it has anything) drops.

- **Movement:**
  - walks to where you click: shortest path (A*), smoothed into straight lines;
  - speed depends on terrain (grass > sand > shallow water);
  - cannot enter medium depth, ocean or outcrops.
- **Notices** are the character's thoughts: short lines **at the top center of the screen**, in **first person** ("I feel safe here", "I cannot carry any more"). For many moments the character has **several lines and says one at random** each time (entering the house: "Home sweet home", "I feel safe here", "This is my place", "I can get some rest now"; making the basket: "Now I can carry more things"…).
- **Hover on a house, a hut, a chest, a cage or a trap:** it lights up (drawn brighter), its cells get a golden outline and the pointer becomes a hand, so you know a click does something with it (open, enter, bait or pick up).
- **What a click means:** the cell under the pointer, except that whatever is drawn standing (a tree, an animal, a build) covers the ground behind it: clicking its drawing means it. The highlighted cell is always the one the click will act on, at any camera tilt. When drawings overlap (two chests side by side, an animal in front of a tree), the one standing on the cell under the pointer wins; otherwise the front one.
- **Gathering:** clicking a cell with something harvestable makes the character walk there and **gather it** (if a tool is in the hand, the click may use it instead; see Workshop):

| Element | Stored as | How much | What remains |
|---|---|---|---|
| Branches | 🪵 Wood | 2-3 (the ones you see) | they disappear |
| Loose stones | 🪨 Stones | 2-3 (the ones you see) | they disappear |
| Bush with fruit | 🫐 Berries | all it has (up to 4) | the bush, without fruit until next season |
| Flowers | 🌼 Flowers | 1 | the stems; they regrow after 2 days |
| Tall grass | 🌾 Grass | what is left (up to 5) | the cut tuft; it regrows after 2 days |
| Axe on the ground | 🪓 Axe | 1 (with its wear) | — |
| Things on the ground (left by a fallen house) | what they are | the whole stack | — |
| Fallen fruit, coconuts and pine cones | 🍎 Fruit · 🥥 Coconuts · 🌰 Pine cones | 1 each | — |

  - A notice says what was gathered (for example "I got 3 wood, 2 stones").
  - If already on that cell, it gathers without moving.
  - What you gather is no longer there for the animals: you compete with them for berries, flowers and tall grass.
  - **If it does not fit in the inventory, it is not gathered** (it stays on the ground) and a notice appears; chopping or cutting meat do not start without room either.
- **Inventory:** 10 slots in the bottom bar, numbered 1-9 and 0.
- **Slots hold a limited stack:** things of one type pile up in a slot up to a limit, then take another slot: **20** in the inventory (and the hand and the basket's slots), **50** in a chest, **100** in the house, **10** in a cage. **A live animal always takes a whole slot of its own**, and so does each jar (with its own water). Dragging piles up to the destination's limit (the rest stays where it was); what does not fit when gathering is left on the ground beside you as a pile, so nothing is lost.
- **Live animals look the same everywhere:** in slots, cages and traps they are shown with their own drawing from the map.
- **Piles on the ground** (dropped, fallen out of a broken basket, cage or chest, left where you died, charcoal and bones from a fire…) show the **same icon as in the inventory**, fully opaque and without a shadow. When things fall out of something, they land beside it, and if there is no room nearby they look a bit farther (inside the house, at its door).
- **Containers above the inventory:** the house storage (2 rows) and an open chest (1 row) appear as rows of slots **just above the inventory, lined up with its 10 slots**, and an open cage (1 row). The open one's **icon** (chest, cage, house, hut), the size of a slot and with its **life bar**, shows at the **right edge of the screen, just above the basket's icon**; the house and the hut also have a **sleep** button (💤) to the left of their icon. There is **no close button** and no popups: a **click anywhere else on the map** closes them (or leaves the house), and so does **Esc**.
  - **Drag and drop** between any of them, the inventory and the hand (same type: merge; otherwise: swap). **Double click** sends a stack to the other side: from a container to the inventory; from the inventory to the open chest or house.
  - Items are grouped by type and each slot shows its amount; **no amount limit** for now.
  - Tools take their own slot.
  - Resources: wood, stones, berries, flowers, grass, meat, hides, bones, fruit, coconuts, pine cones, saplings and crafts (rope, sharp stone, sharpened bone, tanned hide, resin). Also live animals (coati, raccoon, opossum, armadillo, rabbit).
- **Hand:** the first slot, against the left edge (just the frame), is what the character holds. It is separate from the inventory.
  - **Key 1-0** (or click that slot): what is in that slot goes to the hand and what was in the hand goes to that slot.
  - **Drag a slot onto the map** (from the inventory, the hand or a container): a **trap or cage** is placed there and a **sapling** planted (the character goes and does it); **anything else is dropped** there as a pile. The item goes through the hand (what was in the hand takes its slot).
  - **An open chest or cage closes** with any order somewhere else: a click on another place or thing, walking, dropping something, entering the house (and when you walk away from it).
  - **Right click on the map (without dragging) drops what is in the hand** there: the character walks over and leaves the whole stack on the ground as a pile (0.5 s), which frees its slot. Gathering the pile gives it back (tools keep their wear). Live animals are set free instead. Not in water or on outcrops. Dragging with the right button still turns the camera.
  - **Ctrl+click to repeat** (or Cmd+click; on a Mac a Ctrl+click that comes as a right click also counts): the order is carried out and then repeated on the nearest ones within **5 cells** of the first, until there are none left: with the **axe**, any standing tree (chop); with the **shovel**, plants **of that same kind** (dig up); with the **knife** on a tree or bush, plants of that kind whose branches can be cut again; and **gathering** (with the hand or with the knife: tall grass, berries, branches, stones…), the same kind of thing. It stops when there are none left, when nothing more fits in the inventory, when you change what is in the hand, or when you give any other order (a click).
  - **Ctrl+click on a slot of the inventory or of an open container** (chest, house, cage; or Cmd+click) **uses what is in the hand on it**. In a container, what it gives **stays in that container** (if it does not fit, it goes to the inventory; if it would not fit there either, it is not done): the **knife on a live animal** kills it for its meat (with hide and bones); the **torch on pine cones** melts 2 into 1 resin; a **tool (knife, axe, hammer, pickaxe) or stones on a coconut** breaks it open. Anything else: the character says it cannot do anything with them. (Each item declares what can be used on it.)
  - **What the hand does depends on what you click.** For example, fruit in the hand: on a trap → bait; on a campfire or bonfire → fuel; on free grassland → it is sown.
  - Click the hand: it is stored in the inventory.
  - What the character holds **is visible on the character**: a lit torch held high, axe, knife or the object's icon.
  - With the torch, the slot shows a bar with the flame left.

### Jobs (they take time)
Gathering, building, chopping, cutting meat, finishing off or taking a stunned animal, grabbing a frog or turtle and feeding a fire **are not instant**.
- The character stays still working, with a **progress bar** above the head.
- **Animation:**
  - **gather, cut, build:** crouching, with the arm working on the ground; when building, the item appears little by little in front;
  - **chop:** axe blows (the axe swings and strikes, splinters fly) and the tree shakes with each blow; when done, it falls.
- **Durations** (real seconds, measured with the system clock; the character is not sped up by the game clock):

| Job | Duration |
|---|---|
| Gather | from the ground, quick: branches, stones, flowers, axe and things on the ground 0.5 · bush fruit and grass 1.5 |
| Build | rope 2 · torch 2 · sharp stone, sharpened bone, resin, knife 3 · campfire 4 · tanned hide 5 · axe 5 · bonfire 7 |
| Chop | young 3 · adult 5, plus a bit over 1 s of falling before the wood is collected |
| Cut meat | 5 (deer, peccary, jaguar) · 3 (the rest) |
| Finish off / take a stunned animal alive | 1.5 (if it wakes up first, it escapes) |
| Grab a frog or turtle | 1 (if it moves away, it escapes) |
| Feed a fire (campfire or bonfire) | 2 |

- **Materials are spent when the job finishes.** If the job is interrupted (click elsewhere or change what is in the hand) nothing is spent and "Work interrupted" appears.

### Workshop (crafting)
On the left, a **rope ladder hangs from the clock** (from behind it), with one group icon on each rung: **campfire** (Fire), **tanned hide tied with rope** (Crafts), **crossed pickaxe and axe** (Tools), **cage with a bird inside** (Capture: trap, cage and chest) and **two crossed planks with a stone hammer** (Construction). The icons are rustic: stone heads and blades lashed with rope to wooden handles, a coconut-shell jar, a thatched log house.
- When a game starts the ladder **drops down from the clock** with a short fall and bounce.
- **Only what can be made now** (you know how: its skills are learned, and you have its materials) **or is already known** (made at least once) appears. Known things stay even when their materials run out (then grey). A recipe that needs a fire counts as possible when you have its materials (it says to go next to a fire). On the **test map every option is shown** from the start (greyed out when it cannot be made yet).
- A group gets its **rung when it first has something to show**, with a small drop-in animation. While no group has anything to show, **there is no ladder at all**; it drops from the clock when the first rung appears.
- Options that cannot be made yet show a **faded, grey icon on an opaque slot** (the rope does not show through it).
- **Materials nearby count:** with a **chest open** or while **inside the house**, what they store counts for crafting and building, as if you carried it: no need to move it to the inventory. Materials are taken first from the inventory and the hand, then from the open chest or the house.
- **Skills (learning tree):** each thing can only be made after making the things it is learned from (made at least once; the knowledge stays). Some also need a **tool carried** (not used up). The hover text lists both, and the reason when it cannot be made ("first make: …", "carry an axe or a knife"). A new game starts knowing nothing.

| Learned from | Opens |
|---|---|
| (nothing) | torch, campfire, rope, sharp stone |
| campfire | bonfire, resin |
| rope | basket, fence (+ carrying an axe or a knife) |
| sharp stone | knife |
| knife | sharpened bone, hammer, jar |
| knife + campfire | tanned hide |
| knife + rope | axe, trap |
| axe | shovel |
| axe + rope | chest |
| axe + tanned hide | house |
| hammer | pickaxe |
| trap + axe | cage |
| fence | gate (+ carrying an axe or a knife) |
| axe + tanned hide + sharpened bone + resin | bow |

- Clicking one **unfolds its options to the right** (icons only); another click closes it.
- Icons do not change size or position when unfolding. A **click anywhere outside the ladder** folds the open menu.
- The group icon has a golden border if any option can be made.
- Options look grey when materials are missing and have a golden border when there are enough.
- On hover: recipe and what it is for. One click crafts it.
- "Wood" is gathered branches and wood from felled trees.

**Crafts** (second icon, the rope): things made from raw materials that are the materials of more advanced recipes. Each level opens the next: grass → rope → axe, bow, trap, cage, gate, house; stones → sharp stone → knife, axe; meat cutting → hide and bones → tanned hide and sharpened bone → bow, house.

| Craft | Recipe | Used for |
|---|---|---|
| **Rope** | 3 grass | axe, bow, trap, cage, fence, gate, house (it also burns: +0.7 h) |
| **Sharp stone** | 3 stones | knife, axe |
| **Sharpened bone** | 1 bone + 1 stone | bow (arrow points) |
| **Tanned hide** | 1 hide + 2 grass, **next to a lit campfire or bonfire** (within 2 reference cells) | bow, house |
| **Resin** | 2 pine cones, **next to a lit campfire or bonfire** | bow (arrow glue); it burns well (+2.4 h) |
| **Basket** | 6 grass + 2 rope | **5 more inventory slots**, right after the 10 of the bar (separated by a thin line, with a basket-colored border), numbered **1-5** and taken to the hand with **Ctrl+1 … Ctrl+5** (or a click). It does not open or close. Its **icon at the right end of the bar** shows a wear bar (and the days left on hover). **Lasts half a year (10 days)**: when it breaks, **what was in its 5 slots falls beside you** as piles to gather, the inventory goes back to 10 slots, and you can make another one (it stays known in the menu). Only one at a time; a new game starts without it. Later a backpack (rope and hides) will replace it with 10 slots. |

Recipes that need a fire look grey away from one (their tooltip says so) and light up when you stand next to a burning fire.

| Slot | Recipe | What it does |
|---|---|---|
| **Torch** | 1 wood + 1 grass | Goes to the hand lit (whatever was in the hand goes to the inventory) and lasts **one night** (0.55 days of flame while held). Gives little light (2.2 cells) and moves with you. |
| **Campfire** | 3 wood | **Choose its cell** (marked green if it fits, red if not): the character goes next to it and lights it there; it **does not move**. Burns until the next dawn and gives a bit more light (3.5 cells). When out, ashes remain for a day. Click it to **feed it** (see *Feeding a fire* below); fed ashes light again. |
| **Bonfire** | 5 stones + 3 wood | Ring of stones in the **cell you choose** (like the campfire); **does not move**. Burns until the next dawn and gives the most light (5.5 cells). When out the stones remain. Click it to **feed it** (see *Feeding a fire* below): it lasts according to what you add, and lights again if it was out. |
| **Knife** | 1 sharp stone + 1 grass | Click a **dead animal** (with the knife in the hand or just carried; without one the character says it needs a knife) → the character goes and **cuts the meat** (deer 4, peccary 3, jaguar 3, fox 2, the rest 1), and with it **hide and bones** (deer, peccary, jaguar: 1 hide + 2 bones; fox, rabbit: 1 + 1; coati, raccoon, opossum, armadillo: 1 bone). Finishing off a stunned animal with the knife gives them too. The carcass disappears. **Without a knife you cannot get the meat.** Also, with the knife in the hand: **tall grass** gives **double the grass in half the time**, and a click on a **pine, fruit tree or fruit bush** cuts **branches** without felling it (adult tree 3, young tree 2, bush 1; the same plant again after a day). |
| **Axe** | 1 sharp stone + 2 wood + 1 rope | With it in the hand: click a **tree** → goes and **chops it down**: it falls, its wood (5 young / 10 adult) and fruits (fruit tree 5/10 fruit, adult palm 10 coconuts, adult pine 1-2 pine cones) are collected and it disappears. Click a land **animal** less than 4.5 cells away → **throws it**: 55% hit chance (more with weak or still animals, less from afar). On a hit it is hunted; on a miss it flees. Either way **the axe leaves the hand and stays on the ground** (next to the dead animal or where it was) and you must go and pick it up. |
| **Hammer** | 2 stones + 2 wood | With it in the hand: click something **built** → the character goes and **dismantles** it (hammer blows), recovering its materials (see table below). A fence is dismantled post by post. |
| **Pickaxe** | 4 stones + 2 wood | With it in the hand: click an **outcrop** → goes next to it and breaks off rock (3 s): **the stones fall around** and must be picked up. The outcrop **never runs out**. Without a pickaxe, the outcrop gives nothing. |
| **Shovel** | 3 wood + 2 stones | With it in the hand: click a **fruit bush, tall grass or flowers** → digs it up (2 s) as a **sapling** into the inventory. With the sapling in the hand, click a grassland cell with room → **replants** it (bush without fruit until next season; grass and flowers take a day to grow). Does not dig up trees. |
| **Bow and arrows** | 3 wood + 2 rope + 1 tanned hide + 1 sharpened bone + 1 resin | **A single object** (arrows are not used up). With it in the hand: click a land animal **less than 9 cells away** (the axe reaches 4.5) → shoots: up to 75% hit chance, less from afar or if hidden. On a hit it is hunted (the jaguar too); on a miss it flees. The meat, with the knife. |
| **Jar** | 2 open coconuts | Stores and carries water. With it in the hand: click a **lake** → fills it (5 water; the sea is salty and does not work). Its slot shows the water it holds (💧). Put in a cage's slots, its animals drink from it. |

### Wear: everything built has a useful life
- **Tools and capture items** wear with use. The slot shows a **green bar** with the life left of the unit in use; when it reaches 0, that unit breaks and is lost.

| Item | Uses until it breaks | What wears it |
|---|---|---|
| Axe | 25 | chopping a tree, throwing it |
| Knife | about 33 | cutting meat, finishing off a stunned animal |
| Hammer | 20 | dismantling |
| Pickaxe | 20 | breaking rock off an outcrop |
| Shovel | about 17 | digging up a plant |
| Bow | 40 | each shot |
| Jar | about 33 | filling it |
| Trap | **5 catches** | each catch: after the 5th, it falls apart when you pick it up (the animal inside is yours) |

- **The basket** wears with time: half a year (10 days); then it breaks and its contents fall beside you.
- **Structures in the world** wear with time: fence posts and gates 60 days, **cages and chests 2 years (40 days)**, bonfires 80 (traps only wear with catches). Signs of wear (cracks) appear on them; when worn out they **fall apart** and their materials are lost. A broken cage: **its animals escape**, and their **food and jars of water stay on the ground** as piles. A broken chest: **everything it held stays on the ground** as piles, in its cell and around it. An open cage or chest shows its life left as a bar on its icon (at the right, above the basket's; days on hover).
- **A trapped animal escapes** if nobody picks up the trap within **a whole day** of the catch.
- A trap or cage placed from the inventory keeps the wear it had, and takes it back when picked up. A thrown axe keeps its wear on the ground.
- **The house lasts 5 years (100 days).** From its **4th year** it shows signs of decay that grow during that year: darker wood, holes in the thatch and, at the end, it leans. At 5 years it **falls down**: its materials are lost and what was in its storage is left **on the ground**, exposed, where it stood (one pile per stack; live animals kept in it run away). If you were inside, you are left at the door.

### Feeding a fire
- Campfires and bonfires burn for a set time. **Anything of plant origin is fuel:** click a campfire or bonfire and the character throws **one unit** on it (2 s), which adds burning time.
- What is thrown: the plant-origin thing **in the hand**; with anything else in the hand, wood from the inventory, or grass if there is no wood.
- Each thing adds a different amount (in game hours, 1 day = 24 h):

| Fuel | Adds |
|---|---|
| Wood | 2.9 h (0.12 days) |
| Coconut | 1.9 h (0.08 days) |
| Pine cone; pine or fruit tree sapling | 1.4 h (0.06 days) |
| Grass; palm sapling | 1.2 h (0.05 days) |
| Bush sapling | 1 h (0.04 days) |
| Tall grass sapling | 0.7 h (0.03 days) |
| Fruit | 0.5 h (0.02 days) |
| Berries, flowers, flower sapling | 0.2 h (0.01 days) |

### Capture: traps and cages
Third workshop icon (the cage). What you make goes to the inventory; with it in the hand, the cell under the mouse is marked (green if it fits, red if not) and a click places it there.
- **How a trap looks:** a box of sticks with its **lid propped open on a stick**; with bait, the **fruit (red) or berries (purple) show at the opening**, and without bait it is empty. When an animal goes in, the **lid falls shut** (a quick swing) and the animal is seen moving inside.
- **Health of live animals:** a captive's **food and water** run out with time. A **bar** shows what is left of the one that runs out first — **amber** if it needs food, **blue** if it needs water, **red** when it is about to die — on its **slot** (inventory, house, chest or cage: the weakest one of the stack), and **over a trap with an animal and over a cage** (the weakest one inside).

| Slot | Recipe | How it works |
|---|---|---|
| **Trap** | 4 wood + 1 rope | When placed it uses **1 fruit or 1 berry as bait** (if you have none, it stays unbaited: click it with fruit or berries to bait it). **Small mammals** that eat fruit smell the bait 8 cells away and prefer it to other food: when they go in they are **trapped alive** (you see the animal inside and the door closed; a notice if you are close). Click it to **pick it up**: it goes back to the inventory with the animal (alive) and the bait if it was not eaten. |
| **Cage** | 8 wood + 2 rope | **5 slots** for **live animals, food and jars of water**, which can grow to **10**: a **+** button after its last slot adds one for **2 wood + 1 rope** (materials of an open chest or the house count too). Click it → its slots show as a row above the inventory (like a chest; a click elsewhere on the map closes it): **drag** animals, food and jars between it and the inventory (or double click them). Each slot holds **one animal**, or **up to 10** of one kind of food, or one jar. The cage on the map **gets longer** with each slot added, and its animals are drawn inside it. The animals **eat and drink by themselves** from the food and jars in its slots whenever they are hungry or thirsty: food of their diet (fruit and open coconut, berries, flowers; rabbits grass and flowers; frogs flowers or berries; turtles fruit, berries or flowers), one unit at a time, and 1 water from a jar that has some. Each animal stack's slot shows its health bar, and the weakest one's bar shows over the cage; a jar with water shows as a full trough inside. It cannot be picked up for now (the option is off until further notice); with the hammer, empty it first. If it breaks, its animals go free and the rest falls to the ground. |

**Captive animals** (in the inventory, in a trap or in a cage):
- They get hungry and thirsty: they **starve** as in the wild (small ones after 5 days, rabbits after 3) and **die of thirst after 3 days** without drinking; a notice appears when one dies.
- They can only eat and drink in the cage; not in the inventory or in a trap.
- With a live animal in the hand, click the ground to **release it** (for example, inside a fenced pen).

### Construction: hut, fence (and the house, later)
Fourth workshop icon (the house). After choosing a build, the next click on the world says where; the character goes and builds it. Materials are paid when each build finishes.

| Build | Cost | How it works |
|---|---|---|
| **Hut** | 12 wood + 20 grass + 3 rope (after making rope and a knife) | A **thatched cone over 3 cells** (a triangle of them), with a low doorway on the side facing you. Click it to **enter**: inside you are **safe from predators** (like the house) and from dusk on you can **sleep** until dawn. **No storage.** Lit up under the mouse; a click outside takes you out. Lasts **1 year** (darker in its last season, then it falls down); its life shows as a bar on its icon while you are inside. |
| **House** | (not available for now) | **Out of the build menu until later in the game**: it will come back once metals are conquered and a **saw** can be made. Houses built before keep working: 13 cells, 20-slot storage (100 per slot), safe, sleeping; lasts 5 years, its life shows as a bar on its icon while inside. |
| **Fence** (by posts) | **1 wood + 1 rope per post**, carrying an **axe or a knife** | Each click marks a cell: a **vertical post** at its center. The new post is joined with rails to the **nearest post** (up to 8 cells away, about 3 reference cells), filling the cells in between with posts (all marked green before you click). Keep marking cells until you press Esc, press the icon again or run out of materials. **No animal crosses it**: those inside do not get out and land predators do not get in (birds fly over). The character does not cross it either. With the **hammer** in the hand, click a post to take it out (you recover its wood). |
| **Gate** (post) | 2 wood + 1 rope, carrying an **axe or a knife** (after making a fence) | A post (with lighter rails) that **only the character passes through**. |
| **Chest** (in the **Capture** menu, next to the cage) | 6 wood + 2 rope | Cheaper than the house, for before you can build one. **Choose its cell** (green if it fits); built in 5 s and it **stays there** (it cannot be moved or picked up). **Click it** → the character goes next to it and it opens: its **10 slots** appear as a row above the inventory. It closes when you walk away (more than 2 reference cells), when you **click anywhere else on the map**, or with Esc (it has no close button). Its icon, with its life bar, shows at the right above the basket's. It lasts **2 years**; when it breaks, what it held is left on the ground. What you store stays in it; **each chest keeps its own things**. It looks rustic: rough planks between round branch posts and a plank lid tied down with two ropes. |

### Inside the house or the hut
- **Click any of its cells** → the character goes to the door and **enters** (day or night). Inside **the character disappears from the map** together with its light (and its torch's), **it is safe** (predators do not attack it), the windows light up, the house glows warmly at night and the chimney smokes.
- On entering, the **house storage: 20 slots** appears as **two rows of 10 just above the inventory**, lined up with it (see Containers). What you store **stays in the house** even if you leave.
- **Drag and drop** (with the mouse): between the storage, the inventory below and the hand. Dropping on a slot of the same type **merges** the stacks; on something else, it **swaps** them. There is always one stack per type (jars go one by one, each with its water). **Double click** a slot to move it to the other side (storage ↔ inventory). Dragging also works outside the house to sort the inventory or put something in the hand. The basket can be open at the same time.
- **Sleep** button (💤, to the left of the house's or hut's icon, at the right above the basket's): only at dusk or at night. The **screen goes black** and only the **clock** is seen moving on (the night runs at ×60); at dawn you wake up and the map comes back. **Leave**: a click on the map outside it (or Esc); there is no close button. The hut has no storage rows: just its icon (with its life bar) and the sleep button.
- A **click on the map outside the house** takes the character out (and then does what that click means: walk, gather…). A click on the house itself does nothing.
- **Live animals kept in the storage** still get hungry and thirsty and die just the same (they do not eat there: use the cage for that).

### Dismantling with the hammer

| What | Takes | You recover |
|---|---|---|
| Fence post | 1 s | 1 wood + 1 rope |
| Gate | 1.5 s | 2 wood + 1 rope (all) |
| Chest | 2 s | 6 wood + 2 rope (all). **Only when it is empty.** |
| House | 8 s | 30 wood + 15 stones + 6 rope + 2 tanned hide (all). **Only with the storage empty.** |
| Cage | 3 s | 8 wood + 2 rope, what is in its slots and **its live animals** to the inventory |
| Trap | 1 s | 4 wood + 1 rope, the bait if still there and the trapped animal (alive) |
| Bonfire | 2 s | 5 stones (the wood already burned) |
| Campfire | 1 s | nothing: only ashes |

- If everything does not fit in the inventory, it is not dismantled and a notice appears.

### Hunting and catching without tools

| What | How | Result |
|---|---|---|
| **Small mammals** (coati, raccoon, opossum, armadillo, rabbit) | With **stones in the hand**, click one less than 4.5 cells away: you throw **1 stone** (it is used up). 60% hit chance; less if hidden or far | On a hit it is **stunned** for about 30 s at ×1, lying with little stars; on a miss it flees |
| A **stunned** animal | With the **knife** in the hand, click it | The character goes and kills it: 1 meat |
| A **stunned** animal | Without a knife, click it | The character goes and **puts it alive in the inventory** (to tame it later with cages) |
| **Frogs and turtles** | Click them (without the axe in the hand) | The character goes and grabs them **alive**: they go to the inventory as live animals (they can be set free, or kept in a cage: frogs eat flowers or berries, turtles fruit, berries or flowers). **With the knife in the hand** it gets their **meat** instead (frog 1, young turtle 1, adult 3) |

- If the stunned animal wakes up before you arrive, it escapes: it runs to another forest (the rabbit, to its burrow).
- Predators can also take advantage of a stunned animal.

**Fire keeps predators away:**
- They do not come closer than its radius: torch 2 reference cells, campfire 3, bonfire 4. If they are inside, they move off.
- They do not attack preys that are next to a fire.

### Wildfire
With the **torch in the hand**, click anything **of plant origin** on land (a tree, a bush, tall grass, flowers, reeds, branches, fruit, pine cones, coconuts…): the character goes next to it and **sets it on fire** (1 s).
- **It spreads:** after 2.5 s each burning thing sets fire to others: a **tree**, to everything of plant origin **within 1 cell** around it; **tall grass, bushes, flowers and other small plants**, only to the **cells touching theirs**; things **lying on the ground** (branches, fruit, pine cones, coconuts) burn but **do not spread** it. It stops where there is nothing left to burn (bare ground, sand, water, rocks). Trees burn for 14 s, everything else for 5 s; burning trees go dark and flames rise into their crowns.
- **Campfires and bonfires** can start one too: while lit, a plant in a cell **touching** them may catch fire (about once every 15-20 s on average). Lighting a fire next to plants warns you.
- **What it leaves:** the ground is **scorched** (darker), and each burnt tree leaves **charcoal** to gather (**adult 5, young 2**). Charcoal burns well on a campfire or bonfire (3.6 h per unit).
- **Animals:** of those caught by the flames (within a cell), **60% escape** and the rest **burn**, leaving their **bones** on the ground; carcasses lying there turn into bones too. Animals within **6 cells** of a new flame **run away** from it (prey remember where it was). Birds fly off and fish are safe.
- At night the flames light up their surroundings and keep predators away, like a campfire.
- **Birds that lose their tree** (burnt or felled) move to the nearest standing tree. A predator whose home ends up inside the light of a fire (a campfire, a wildfire, your torch) takes a new home away from it, instead of trying to go back forever.

### Night
- At night the screen darkens:
  - at dusk, little by little;
  - in the middle of the night, a lot;
  - at dawn, the light comes back.
- Without fire, the character barely sees around (1 reference cell).
- Fires open circles of light with a flickering warm glow.
- **The torch only burns in the dark:** by day, in the hand, it does not wear out.
- **Being without light is dangerous:** in full night and outside the light of any fire (or without a torch in the hand):
  - an adult **jaguar** less than 9 cells away goes after the character. First the notice "Something is following me in the dark… I need a fire" appears, then it stalks, charges and, if it reaches it, **attacks it** (see Attacks and struggles);
  - a **caiman** attacks if the character is on the shore or inside its lake, next to it: 40% per attempt; on a miss, a warning appears.
  - Lighting a fire or taking out the torch keeps them away **before** they attack; once the attack has started, fire no longer stops it.
- **Attacks and struggles (jaguar, caiman):** nothing dies at once.
  - The character has **100 health** (not shown yet), which **heals by itself slowly** (about 40 a day; full again on waking up after dying). Each **bite** of a jaguar or a caiman takes **30**, with a **red flash** on the screen and a notice that says how bad it is: the fourth bite kills.
  - Once a predator has bitten the character **it does not give up**: after each bite it **backs off 2-3 cells** (facing the character, a moment at most 2.5 s), then **rushes in again** and bites (it runs much faster than the character), over and over. Fire no longer scares it away. The ways out: **getting into a shelter** (hut or house: it prowls off), **fighting back**, or getting where it cannot follow (the caiman cannot leave its shore, the jaguar does not wade into water): after 10 s out of its reach it gives up.
  - **Fighting back:** with the **knife** or the **axe** in the hand, **click the predator** attacking you (within about 1.5 cells; the axe is not thrown): 75% to hit, the knife takes **35** of its 100 health and the axe **50**. Badly hurt (below 50) it often **runs off wounded**; at 0 it **dies** (its meat can be cut). The bow still works as always (an arrow can kill it outright).
  - **Preys:** when a jaguar or a caiman catches a prey it **holds it**: the prey **thrashes** in its jaws and the predator **bites every few seconds** (35 the jaguar, 40 the caiman; more to weak preys) until it dies. At each bite the prey may **tear free** (big and healthy ones, deer and peccaries, far more often than small or weak ones) and run off wounded; the jaguar **chases it again** (a fresh sprint) and keeps attacking until it kills it or tires; the caiman cannot follow. A wounded prey (below 50 health) counts as **weak** until it heals (about 60 a day). Other predators (fox, eagle, heron...) still kill at once.
- **Death:** "You died" appears with the cause. **The map does not change**: everything you carried (inventory, hand and the basket's slots) is **left as piles where you fell** (live animals run off; the basket is lost), and your builds, chests, cages and their contents stay. **Wake up the next day**: the screen goes black, the clock runs to the next dawn and you wake up in a **safe place** of the same map (a meadow with no predators around, away from where you fell). What you had learned is kept.
- **It scares animals:** see §6.
- **Population chart (P key):**
  - a mini-chart per species and per plant type (30 in total), with the current number and its evolution since day 1 (one sample every quarter of a day);
  - on hover, every chart marks the same day and its value.
- **Clock:** on its rim, the season (top left), the **compass** (bottom left; click: point north) and, to its right, the **map icon** and the **find-the-character icon** (target).
- **Camera:** it follows the character by default (every new world starts following). Dragging the view, the WASD keys or a click on the map stop following; the **target icon** or the **C** key bring the camera back to the character and follow it again.
- **Zoom** (mouse wheel, + and − keys): rests between 120 (closest) and **30** (farthest), because the view costs too much to draw farther out (drawing time grows with the area seen: zoom 30 ≈ 30 ms per frame in the worst case, zoom 6 was over 200 ms). For a wide view use the map (M).
  - **Clouds:** you can push the zoom out to 20, but past 30 clouds start to appear (each at its own zoom, high above the ground, drifting slowly), and at 20 only clouds and a pale sky are seen (the world is not drawn then). They darken at night like everything else.
  - When you stop zooming (¼ s without wheel or +/−), the camera **comes back to 30 by itself in 1 second**.
- **Performance panel** (Options → View → FPS, off by default): top right, refreshed every 0.5 s; orange below 50 fps, red below 30. Its lines:
  1. Frames per second, milliseconds of work per frame, **how busy the game's thread is** (work ÷ time between frames: the measure of its CPU load, since the browser does not give the real CPU use) and the zoom.
  2. Where the time goes: the animals' simulation and the drawing (ms per frame), and the slow systems (trees, fires, wear… run every 0.5 s: ms per run).
  3. Animals alive, how many are simulated per frame (far ones less often) and how many things are drawn.
  4. What exists in the world: trees, other plants, things on the ground, nests and burrows, builds.
  5. JS memory (Chrome and Edge only), the system's **CPU pressure** (low, moderate, high, critical; only where the browser offers it), browser tasks over 50 ms in the last 10 s (Chrome) and the cores of the computer. The game runs on **a single thread**.
- **Options popup (O key):** the settings that used to be in the top bar. World (radius, new world, fill inventory), view (tilt, turn, elements, edges, follow, straight-line walking, FPS), terrain brushes and time speed. O or Esc closes it; only one popup (options or population) is open at a time.
- **Map:** with the icon or the **M** key it unfolds in the center like a **parchment with burnt edges**. It shows the whole world, the visible area and the character; click the map to go there.

## 5. Plants

### Trees: pine, fruit tree, coconut palm

| | Pine | Fruit tree | Palm |
|---|---|---|---|
| Where | grassland; forms dense **groves** (a grove cell has at least 2 standing pines in it and its 6 neighbors) | grassland, scattered | beach only |
| Lives | 300-500 days (15-25 years) | 160-280 days (8-14 years) | 200-360 days (10-18 years) |
| When chopped, young / adult | 5 / 10 wood | 5 / 10 wood, 5 / 10 fruit | 5 / 10 wood |
| Fruits | 1-2 pine cones **only when an adult is chopped or dies** | 1-2 fruits at its foot, in summer | 1-2 coconuts at its foot, in summer |

- **Size:**
  - young = base size;
  - adult = twice as tall as the character.
- **Map start:** 50% young (less than a year old) and 50% adult (from 1 year to almost their life expectancy).
- **Growth:**
  - none grows in the first spring;
  - from the second spring on, at the start of every spring, **30% of the remaining young trees** grow;
  - each tree starts at a different moment and **takes a full day** to grow (you see it grow little by little);
  - it always finishes within the spring;
  - while growing it still counts as young.
- **Fruit and coconuts in summer:**
  - only mature adults drop them: 7 days after finishing growing;
  - once every summer, each tree at a different moment;
  - they fall in a free cell beside the tree;
  - young palms have no coconuts;
  - **without bees nearby** (see Beehives), a fruit tree drops 0-1 fruits instead of 1-2.
- **Death:**
  - **only in winter**: the winter in which they reach their age, each at a different moment (2-3% of trees per winter);
  - **you see them fall**: they rotate on their base in a bit over 1 s (at ×1), stay lying and faded for **5 days** and then disappear;
  - **their fruits stay beside them**:
    - fruit tree: 2-3 fruits (1 if young);
    - adult palm: 1-2 coconuts;
    - adult pine: 1-2 pine cones;
    - young palms and pines leave nothing;
  - a fallen pine no longer counts for the grove (gives no shelter).
- **Natural pine sowing:** every autumn, 3% of adult pines sprout a young pine in a free neighboring cell.
- **Wind:** a single wind blows over the whole valley; it turns now and then (about 3 times a day), so everything bends the same way and, after a while, toward another. It blows hardest in autumn, then winter, spring and least in summer, with gusts. **Tall grass** bends a lot; **palms** a little; **pines** and **fruit trees** very little.

### Fruit, coconuts and pine cones on the ground

- **Coconuts fall and are gathered whole.** To use them they must be **broken open**: with a knife, axe, hammer, pickaxe or stones in the hand, **Ctrl+click** the coconuts in the inventory (or in a chest, the house or a cage: they stay there) → an **open coconut** (1.5 s). Open coconuts are the material of the **jar** (2) and are **food**: trap bait, and food for caged animals that eat fruit.
- Pine cones lie on the ground: a tapering cone covered in a lattice of woody scales with pale tips.
- They **rot after 5 days**.
- When rotting they can sprout into a young plant in their own cell:
  - fruit → fruit tree: 20%;
  - pine cone → pine: 20%;
  - coconut → palm: 16% (only on sand).
- The sprout **takes a day** to reach young size; meanwhile it has no fruit. During the first half of that day it is a **seedling** (a thin stem with two leaves), then a small tree that keeps growing.
- **Sowing by hand:** with fruit, a pine cone, a coconut or berries in the hand, click a free cell of the right ground (grassland; sand for coconuts) → the character sows it (1 s): one unit is spent and it **always sprouts** there (fruit → fruit tree, pine cone → pine, coconut → palm, berries → fruit bush), then grows like any other sprout. A sown bush is a seedling for half a day, then grows to full size by the end of the day; it has no berries until the next season. The cell is marked green while hovering; red on the wrong ground (then the click just walks).
- **Parrots disperse seeds:** now and then they drop a fruit 5-15 cells away from the fruit tree where they ate (it then rots and may sprout like the others).

### Fruit bush
- It does not grow or drop fruit.
- **4 fruits** at the start of spring and another 4 at the start of summer (**2** if there are no bees nearby).
- In **autumn** it loses its fruit: each bush gets one day of autumn (20% of the bushes per day).
- In winter they are empty.

### Tall grass
- Meadows of tufts, one per cell. Each tuft has **5 units** of plant food.
- At 0 it looks trimmed and **regrows after 2 days** (on the second day you see it growing back).
- **Overgrazing:** a tuft eaten down to 0 **8 times in the same year** dies.
- **Spreads:** every spring, 6% of the tufts sprout into a neighboring meadow cell.
- **Seeds in the soil:** every spring new tall grass sprouts in about 1% of the empty meadow (per reference cell).
- **Winter:** 5% of the tufts dry up.

### Flowers
- 1 unit of food. When eaten, the stems remain and they regrow after 2 days.
- In winter 2% dry up.

### Aquatic plants
- Water lilies, lotuses and reeds, **only in lakes**.

### Loose stones
- Scattered at random over grassland and sand, and always in 4 cells next to each outcrop.
- Gathered as stones.

### Branches
- Dry branches lying on the ground, on grassland.
- Scattered at random, mostly in and around forests (probability per reference cell of grassland):

| Where | Probability |
|---|---|
| Inside a grove | 12% |
| 1 cell away | 10% |
| 2 cells away | 5% |
| Far from forests | 0.6% |

- A normal map has about 140, most of them in forests or right next to them.
- Gathered as wood.

## 6. Animals

### 6.1 Life cycle (every species)

- **Age:** every animal has an age; when the map is created they get varied ages.
- **Old age:** each animal lives a random number of days within its species' range.
  - Mammals (deer, small ones, rabbits, peccaries, jaguars, foxes) **lie down and wait for death** for half a day and leave a carcass.
  - The rest (fish, frogs, birds, turtles, crabs, caimans, sharks…) simply disappear.
- **Births:** each species breeds in its seasons (table 6.2).
  - A percentage of the **adult pairs** (adults ÷ 2) has a litter; births are spread over the season.
  - The young are born next to their mother; if the mother dies before giving birth, they are not born.
- **They only breed when well fed:** species that eat in the game do not breed if they have been really hungry in the last 3 days (predators: if they have not eaten for a while).
- **Carrying capacity:** no species breeds if it already exceeds a multiple of its initial population (table 6.2). It is the limit of what the valley can sustain.
- **Immigration:** if, when spring comes, a species has dropped below a minimum (2 individuals or 15% of its initial population), **adults arrive from outside the valley** at the places where that species lived. It prevents extinctions by bad luck when very few are left.
- **Harsher winter:** in winter animals get hungry 30% more often (predators 20%).

### 6.2 Species summary

| Species | Lives in | Eats | Lives (days) | Breeds | Litter | Cap |
|---|---|---|---|---|---|---|
| Deer | grassland, herds of 3-5 | tall grass (when very hungry: flowers and fruit) | 140-200 | spring, 30% of pairs | 1-2 | ×1.5 |
| Peccary | grassland, herds of 4-6 | fruit, bushes, tall grass | 120-180 | spring, 40% | 2-3 | ×2 |
| Rabbit | burrows in meadows | tall grass and flowers | 30-50 | spring and summer, 60% | 2-5 | ×2 |
| Coati, raccoon, opossum, armadillo | hidden in forests | fruit, bushes, flowers | 40-60 | spring, 80% | 2-4 | ×2.5 |
| Turtle | beach and sea | — | 400-600 | summer, 40% (nest) | 3-5 eggs | ×1.6 |
| Frog | lakes | — | 30-50 | spring, 80% | 3-6 | ×1.6 |
| Crab | sea beach shoreline | — | 40-60 | summer, 50% | 2-4 | ×1.5 |
| Small fish | shallow and medium water | — | 30-50 | spring, 90% (spawns in shallow water) | 3-5 | ×1.5 |
| Fish school | shallow and medium water | — | 60-100 | spring, 80% | 1-2 schools | ×1.5 |
| Whale | ocean | — | 600-800 | spring, 15% | 1 | ×1.5 |
| Parrot | fruit trees and palms | tree fruit | 200-300 | spring, 40% | 1-2 | ×1.6 |
| Beehive | adult trees with flowers nearby | flowers | 100-160 | splits in spring | — | ×1.6 |
| Jaguar | forests | deer, peccaries, coatis, armadillos, rabbits | 200-280 | spring, 50% | 1-2 | ×1 |
| Fox | burrow at the forest edge | small mammals, rabbits, frogs, crabs, eggs; fruit if there are no preys | 80-120 | spring, 60% | 2-4 | ×1.5 |
| Eagle | nest in an adult pine | small mammals, rabbits, frogs, fish, schools and crabs in sight | 300-400 | spring, 30% | 1 | ×1.5 |
| Caiman | big lakes | whatever drinks on its shore; deer and peccaries only if weak | 400-600 | summer, 30% | 1 | ×1 |
| Shark | medium and ocean | turtles, schools, small fish | 400-600 | spring, 20% | 1 | ×1.5 |
| Heron | shallow water and shores | small fish, schools, frogs, crabs | 150-220 | spring, 40% | 1-2 | ×2 |
| Gull | sea beaches | small fish, schools, crabs | 100-160 | spring, 40% | 1-2 | ×1.6 |
| Vulture | adult trees | carcasses | 300-400 | spring, 30% | 1 | ×2 |

**Grow with age:** deer (born at 55%, adult at 20 days), peccary (50%, 15 days), turtle (35%, 40 days), whale (50%, 40 days), jaguar (50%, 20 days), caiman (40%, 40 days). The rest do not grow.

### 6.3 Fleeing

| Animals | Wary of the character closer than (they run at half of it) | Flee from a predator hunting them closer than |
|---|---|---|
| Deer | 3 cells | 3 cells |
| Peccaries | 3 | 2.5 |
| Rabbits | 2.5 (except inside the burrow) | 3 |
| Small mammals | 2, even when hidden | 2 |
| Small fish, schools | 1 | 1.5 |
| Frogs | — | 1.2 |
| Turtles, crabs | — | 1 |

- **The character makes them wary, not panicked.** Within the distance in the table:
  - on their way to drink, eat, rest or shelter they **keep their goal and look for a way around** the character (their routes never take them closer to it than they already are); if there is no way around, they stop, watch and try again a moment later;
  - drinking or eating, they carry on, watchful;
  - idle, they **walk** a few steps away; lying down or hidden among the pines, they stay still;
  - only when the character comes **within half of that distance** do they run, as before.
  - When they choose where to drink, eat or shelter with the character nearby, they pick places away from it. Rabbits always go straight to their own burrow.
  - When the character is inside the house they ignore it.
- **Foxes are not afraid of the character**, but closer than 3 cells they trot a few cells out of its way (if they are not chasing a prey), and stay there a while.
- **Jaguars:** in daylight (or near light) a jaguar that is not hungry **stands still and watches** the character closer than 6 cells, facing it ("A jaguar is watching me…"); the character can **walk away freely**. **Coming closer than 2.5 cells** to it (walking toward it, or while it watches) makes it **attack** at once (it charges; see Attacks and struggles); if it is the jaguar that wanders that close to a character who is not coming at it, it slinks off. A hungry jaguar ignores the character and hunts. In the dark it is still dangerous (see Night).
- **Do not bother a jaguar or a caiman.** Each time the character **walks toward** an adult and gets closer than **4 cells (jaguar)** or **3 cells (caiman)** counts as an approach. It counts again only after moving away (about 5 cells from a jaguar, 4 from a caiman), or after the jaguar has slunk off from you, and at most once every few seconds; passing by or an animal coming to you does not count. On the **2nd approach in the same day** it warns you ("The jaguar growls at me…", "The caiman hissed at me…"); on the **3rd** it **attacks, even by day**: for about 10 s the jaguar charges and the caiman lunges to the edge of its shore; if it reaches the character (the caiman bites from 1.2 cells) **the attack begins** and it does not stop (see Attacks and struggles). Before it reaches you, a fire near it, getting into a shelter or keeping out of its reach saves you. The count starts again every day.
- **Hunting a caiman:** with the **bow** (it is hard to hit: about half the shots at 3 cells), or the **axe** only when it is **on land** (in the water the axe would sink, and the character says so). A **missed shot or throw bothers it** like an approach (the 3rd bother of the day makes it attack). Dead, it floats belly up, pale; the knife gets **3 meat, 1 hide and 2 bones**.
- **Jaguars chase foxes off:** a fox that comes within 3 cells of an adult jaguar gets a short charge and runs away fast, leaving whatever it was eating.
- **Any land predator nearby is a threat**, hunting or not: deer, peccaries and the others move away when a jaguar, fox or caiman comes within their alert distance, even if it is only strolling. Birds of prey only scare them when they dive at something.
- A **sleeping** or resting animal rarely notices it (about a third of the distance); one **drinking or eating** notices it later (60%). A predator lying still is noticed later (70%), and one eating later still (50%).
- **Caimans:** animals do not go to drink at the shore right next to a caiman they can see; they look for another spot of the lake.
- **Stealth:** a hunting eagle, fox, shark, gull and heron get closer unseen (the heron is barely noticed).
- **Fear memory:** after fleeing from a predator an animal remembers where it was for about **3 game hours**: its trips go around that spot, and if it is hidden (burrow, grove) it **stays hidden** unless thirst or hunger become pressing. A **very thirsty or hungry** animal takes the risk: it only runs from a predator that is actually coming for it, not from one resting or strolling nearby. (Before, a fox lurking by a burrow made the rabbit come out, see it, run back in and come out again endlessly.)
- **How they flee:**
  - small mammals: run to another forest that takes them away from the threat;
  - rabbits: to their burrow;
  - the rest: in the opposite direction.
- Young, old, dying and hungry animals flee more slowly.

### Movement
- Animals are **unhurried**: they walk at a calm pace (much slower than when they flee or hunt) and stand still for a good while between walks. Small ones (rabbits, coatis…) walk faster than deer and peccaries.
- Frogs stay still most of the time (a hop every 8-30 s); fish drift slowly with pauses; bees fly out a few at a time, stay a while on the flowers and come back.

### 6.4 Deer
- **Drinking:** only at lakes, never at sea. It gets thirsty about 2.5 times a day; it always drinks at dusk and on waking → **at least twice a day**.
- **Food:** it gets hungry about 1.6 times a day (**at least once a day**). It eats **tall grass** (1 unit per meal).
  - If it sees no tall grass (within 12 cells) and is **very hungry**, it eats **flowers or fruit**.
  - If it is not very hungry, it goes farther to look for tall grass.
- **Night shelter:**
  - at dusk it drinks (and eats if somewhat hungry) and goes to the nearest grove (one animal per cell);
  - there it **lies down** and comes out at dawn;
  - it only comes out if it is extremely thirsty or hungry.
- **Daytime rest:** on average every 0.3 days it lies down for a while (20-60 s at ×1) next to a lake or in a nearby grove.
- **Fawns:**
  - follow a reference adult: free up to 3 cells, they catch up if they stray farther, and at times they stick close to it;
  - at night, always next to it;
  - they eat and drink when it does;
  - when they become adults they become independent;
  - every herd starts with at least one adult.
- **Births:** every spring **30% of the pairs** have **1 or 2 fawns** (sometimes twins), if well fed.
- **Life expectancy:** **7-10 years (140-200 days)**; when its time comes it lies down and waits for death for half a day.
- **Migration:** if there are more than 10 deer within 6 reference cells, one leaves for an area with tall grass and no deer (12-40 reference cells away).
- **Death by starvation:** after 3 days without eating.

### 6.5 Peccary
- Omnivore in herds, it competes with deer for fruit and tall grass.
- It behaves like the deer: drinks at lakes, shelters in groves at night.
- It dies after 4 days without eating.

### 6.6 Rabbit
- Lives in groups in a **burrow** (a visible hole in the meadow).
- Eats and drinks once a day and dies after 3 days without eating.
- Inside the burrow it is not visible and **it is safe** (neither the character nor predators reach it).
- Comes out to eat and drink.
- If scared, it runs to its burrow.
- The young share their mother's burrow.

### 6.7 Small mammals: coati, raccoon, opossum, armadillo
- When the map is created: 1-3 per forest (forests smaller than a reference cell get none), already hidden.
- They eat and drink about **once a day**; they starve after **5 days without eating**.
- **Hidden:**
  - more than 90% of the time, almost transparent;
  - they only come out to eat, drink or **move to another forest** (every 1-2 days);
  - at night they wait for daytime to eat or drink.
- **Cover:** hidden among the pines only the fox finds them, and it finds them twice as hard to catch.
- **Armadillo:** its armor makes it twice as hard to catch.

### 6.8 Turtle
- **On land:** they stay within 3 cells of water.
- **At sea:** depending on their size. They do not enter lakes.

| Size | How far they go |
|---|---|
| Young | shallow water |
| Medium (70% or more) | medium depth |
| Adult | ocean |

- In the water they swim 3 times faster.
- At night adults can sleep in the water; the rest go back to the shore.
- **Nests:** in summer females lay a **nest of 3-5 eggs** on the beach next to the sea.
  - It looks like a sand mound with eggs.
  - The eggs hatch after 5 days and the hatchlings are born at 35% size.
  - **Foxes** eat the nests.

### 6.9 Frog, crab, fish and whales
- **Frog:** only in lakes; it strays at most 1 cell from the water. At night it goes back to the lake and stays still.
- **Crab:**
  - on the shoreline of sea beaches (sand next to water and the first water cell);
  - walks sideways;
  - prey of foxes, eagles and herons.
- **Fish:**
  - only **small fish and schools**, in shallow and medium sea water: there are no big or deep-sea fish, so the ocean has only sharks, whales and turtles;
  - there are no fish in lakes;
  - at night they stay still;
  - schools can come up to the shore;
  - in spring small fish and schools **spawn in shallow water**.
- **Whale:** ocean only, it spouts every few seconds and keeps swimming at night.

### 6.10 Parrot
- Lives in an adult fruit tree or palm. Bright green with a yellow head, big enough to stand out over the canopy.
- **By day:** flies from fruit tree to fruit tree (within 12 cells of its tree) and perches to eat.
- **Seeds:** when leaving, it sometimes drops a seed far away.
- **At night:** perched on its tree.
- **Without a tree:** if its tree dies, it looks for another nearby; without fruit trees nearby it dies after 4 days.

### 6.11 Beehives (bees)
- Honeycomb hanging from an adult tree with flowers nearby. In spring and summer, by day, you see bees going back and forth to the flowers.
- **Pollination:** fruit trees and bushes with a beehive within ≤6 cells and flowers within ≤3 give all their fruit; otherwise half or less.
- **Cycle:**
  - in spring, a beehive older than a year with many flowers nearby (≥8 within 5 cells) can split into another beehive in a nearby tree;
  - in winter it dies if it has few flowers nearby (<4);
  - it also dies if its tree falls or of old age (5-8 years).

### 6.12 Predators

| Predator | Hunts | When | How |
|---|---|---|---|
| **Jaguar** | deer and peccaries (healthy ones only when very hungry; prefers weak ones), coatis, armadillos, rabbits | always | stalks and, at 2.5 cells, charges very fast for about 10 s; 30% chance to grab a healthy adult, much more weak or sleeping ones; then the **struggle**: it holds and bites it until it dies or tears free (and chases it again) |
| **Fox** | small mammals (hidden ones too), rabbits outside the burrow, frogs, crabs, nests | dusk and night | sneaks up and runs; if it finds no preys, it eats fruit from the ground |
| **Eagle** | small mammals, rabbits, frogs, fish and schools in shallow water and crabs **in sight** (not hidden ones) | by day | circles high over its nest and dives as soon as it is a bit hungry and sees one |
| **Gull** | small fish, schools, crabs | by day | circles over the coast and dives for them; at night rests on the beach |
| **Caiman** | whatever drinks or steps on the shore next to it; deer and peccaries only when weak | always | still on the lake shore, lying in wait; 25% chance to grab it per attack, then it holds and bites it (the prey may tear free) |
| **Shark** | turtles, schools, small fish (it finds them in medium water) | always | chase in the water; you see its fin |
| **Heron** | small fish, schools, frogs, crabs | by day | approaches very slowly unnoticed and pecks with its neck (long reach) |
| **Vulture** | carcasses | by day | soars in wide circles (6 reference cells) searching; when it sees a carcass (up to 14 reference cells) it glides there, **spirals down**, lands beside it and eats for a while; several vultures can share one While eating it **pecks** (the head going down to the carcass and up, on its bare neck) and now and then half opens its wings. |

- **Hunger:**
  - they get hungry every 2.5-12 days depending on the species (jaguar 8, caiman 12, fox 2.5, eagle 6, gull 4, shark 5, heron 2.5, vulture 5); the eagle starts hunting at half that hunger, the gull a bit earlier, and the vulture searches for carrion whenever it is slightly hungry;
  - they die if they go much longer without eating;
  - a small prey barely sates a jaguar or a caiman;
  - after eating they rest.
- **Home:** when resting or outside their hours they go back home (forest, burrow, nest, the shore of their lake).
- **Preys:** big ones (deer, peccary) leave a carcass; small ones are eaten whole (from a school they take a few fish).
- **Jaguar and caiman young:** follow their mother and eat from what she hunts.
- **Initial number:** in proportion to their preys.
  - jaguars: 1 per 20 deer (min. 2);
  - foxes: 1 per 25 small preys (min. 4);
  - eagles: 1 per 25 (min. 2);
  - caimans: 1 in each big lake (max. 3);
  - sharks: according to the ocean;
  - herons: according to the shores;
  - gulls: 1 per 60 reference cells of sea beach (min. 4);
  - vultures: 3.

### 6.13 Carcasses
- They disappear **after 2 days** (sooner if vultures arrive).
- Plants are born in free cells around it:
  - **deer, peccary or jaguar:** 2 tall grass tufts and 1 flower tuft (only 1 grass tuft if vultures ate them);
  - **small mammal, rabbit or fox:** 1 grass or flower tuft (sometimes nothing if vultures came by).
- The new plants take a day to grow.

## 7. Interactions

- **Food chain:**
  - tall grass → deer, rabbits, peccaries;
  - flowers, bushes and fruit → small mammals, peccaries, very hungry deer, parrots;
  - herbivores and small ones → jaguar, fox, eagle, caiman;
  - fish, frogs and crabs → heron, eagle, shark;
  - carcasses → vultures and fertilizer for the soil.
- **Bees connect flowers and fruit:** without flowers there are no beehives, and without beehives fruit trees and bushes give less fruit.
- **Parrots move the forest:** their seeds make fruit trees appear far from the existing ones.
- **Pines give shelter:** groves are where deer and peccaries sleep and small mammals live; inside, only the fox hunts them.
- **Lakes are essential:** the only place where land animals drink; also the caiman's territory.
- **The forest regenerates:** old trees die in winter and leave their fruits; uneaten fruit, coconuts and pine cones sprout; pines sow in autumn.
- **Tall grass balances itself:** it grows in spring, partly dries in winter and dies if overgrazed.
- **Seasons set the food:** plenty in spring and summer, autumn reduces it, winter is the hard season.
- **Population control:** predators, food (they only breed when well fed), old age, carrying capacity and immigration. In 10-year simulations on several maps every species survives, with natural oscillations (small mammals rise and fall in cycles; big predators stay stable).
- **The character scares animals:** a scared animal may not reach the food if the character is next to it.

## 8. To do / ideas

- Inventory limit.
- Use meat, berries and flowers (eat, cook on the fire…).
- Tame the animals in the cage or the pen (breeding, meat, eggs…).
- Character needs (hunger, thirst, sleep) to give a use to meat, fruit and water.
- Diseases when animal density is too high.
- The simulation is only bit-for-bit reproducible with the JIT disabled (see ARCHITECTURE.md): find and remove the floating-point operation whose result depends on the V8 tier.
