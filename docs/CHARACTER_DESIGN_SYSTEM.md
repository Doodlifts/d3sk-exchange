# D3SK Character Design System

> A specification for creating consistent pixel art characters in the D3SK trading universe.

---

## Grid & Proportions

All characters are built on a **4px pixel unit** grid. Every shape edge snaps to 4px increments.

| Property | Value |
|---|---|
| Bounding box | 32 × 76 px (8 × 19 pixel-units) |
| Head | 20 × 20 px (5 × 5 units), centered horizontally |
| Body width | 24 px (6 units) |
| Leg height | 24 px (6 units) |
| Arm width | 4 px (1 unit) each |

Characters should always use `shapeRendering="crispEdges"` and render at integer coordinates to maintain sharp pixel edges.

---

## Skin Palette

Four skin tones used across the character universe. Each character is assigned one tone at creation.

| Name | Hex | Usage note |
|---|---|---|
| Light | `#f5d0a9` | Default for quick prototypes |
| Medium | `#c68642` | — |
| Tan | `#8d5524` | — |
| Dark | `#4a2c0a` | — |

Faces are a single `rect` for the head, with 4×4 px eyes (2px apart, centered). No mouths unless expressing emotion (speech bubble replaces facial expression).

---

## Hair Colors

| Color | Hex |
|---|---|
| Black | `#1a1a2e` |
| Brown | `#6b4423` |
| Blonde | `#ffd700` |
| Red | `#cc3300` |
| Gray | `#888888` |

Hair is rendered as a `rect` on top of the head: 20×8 px, offset -4px above the head rect. Style variations: flat top (default rect), spiky (3 small rects jutting up 4px), long (extends 4px below head on sides).

---

## Outfit Archetypes

Each character wears one of five outfit types. Outfits are defined by body and leg `rect` colors.

### 1. SUIT GUY
- **Body**: Dark navy `#16213e` jacket, white `#e8e8e8` shirt (4px strip down center)
- **Legs**: Dark navy `#16213e` pants
- **Vibe**: Wall Street veteran, institutional trader

### 2. HOODIE TRADER
- **Body**: Dark gray `#2d2d44` hoodie (rounded top corners optional)
- **Legs**: Black `#1a1a2e` joggers
- **Vibe**: Degen, late-night coder, DeFi native

### 3. SUSPENDERS VET
- **Body**: White `#e8e8e8` shirt with colored suspender stripes (2 vertical 4px rects)
- **Legs**: Dark `#2d2d44` pants
- **Vibe**: Old-school floor trader, been around since the pits
- **Suspender colors**: Red `#ff0055` or green `#00ff41`

### 4. VEST BRO
- **Body**: Colored vest over white shirt. Vest is 20×24 px rect, shirt shows as 4px strips on sides
- **Legs**: Khaki `#b8a07e` pants
- **Vibe**: Hedge fund associate, confident

### 5. POLO INTERN
- **Body**: Solid color polo `#4a90d9` or `#d94a90`
- **Legs**: Khaki `#b8a07e` or dark `#2d2d44`
- **Vibe**: Wide-eyed newbie, first week on the floor

---

## Role Color-Coding

Certain jacket/vest colors signal character roles in the D3SK universe:

| Role | Color | Hex | Meaning |
|---|---|---|---|
| D3SK Team | Green jacket | `#00ff41` | Builder, protocol contributor |
| Bear | Red tie/accent | `#ff0055` | Bearish trader, seller |
| Whale | Blue vest | `#4a90d9` | Big money, market mover |
| Degen | Purple accent | `#9945ff` | High-risk, high-reward trader |
| Neutral | Gray/navy | `#3d3d5c` | Background character, no allegiance |

---

## Accessories

Accessories add personality. Max 2 per character.

| Accessory | Construction | Size |
|---|---|---|
| Headset | Arc from ear to ear (2px stroke), small mic rect | 4×8 px mic |
| Coffee cup | Small rect held at hand level, steam = 2 wavy 2px lines above | 8×12 px cup |
| Phone | Rect at ear level, one arm raised | 6×10 px phone |
| Glasses | Two 6×4 px rects over eyes, connected by 2px bridge | 16×4 px total |
| Cap | Rect on head with 4px brim extending forward | 20×6 px + 8px brim |
| Clipboard | Rect held at waist, arm overlapping | 10×14 px |
| Laptop | Rect on floor or desk, open at angle (two rects, L-shape) | 16×12 px |

---

## Poses

Standard poses for characters. Each pose modifies arm and leg positions.

### STANDING (default)
- Arms: Straight down, 4px wide rects alongside body
- Legs: Two rects, 8px wide each, 4px gap between

### SITTING
- Legs: Bent 90° (horizontal rect + vertical rect forming L)
- Requires desk/chair element nearby
- Body shifted down 8px

### POINTING
- One arm extended horizontally or at 45° angle
- Arm = single rotated rect or two connected rects (upper arm + forearm)
- Other arm at side

### ARMS UP (celebrating)
- Both arms raised above head at ~45° angles
- Creates V-shape above shoulders

### RUNNING
- One leg forward, one back (offset 8px each direction)
- Arms in opposite motion (left arm forward when right leg forward)
- Body tilted 4px in direction of movement

### LEANING
- Body at slight angle (4px offset at head vs feet)
- One arm on desk/wall element
- Casual, relaxed vibe

### PHONE CALL
- One arm raised with phone rect at ear
- Body slightly turned (one shoulder forward 2px)

---

## Speech Bubbles

Speech bubbles add dialogue to scene characters.

### Construction
- White `#e8e8e8` fill, 2px `#3d3d5c` border
- Rounded corners: 0 (pixel-perfect rectangles only)
- Triangle pointer: 3 rects stacked (6px, 4px, 2px wide) pointing down toward character
- Pointer attaches to bottom-center of bubble, angled toward speaker

### Text Rules
- Font: monospace, 8-10px
- Color: `#0f0e17` (dark background color)
- Max 12 characters per line, max 2 lines
- All caps

### Common Phrases
| Phrase | Usage |
|---|---|
| `LFG!` | Bullish excitement |
| `HODL` | Diamond hands moment |
| `SELL SELL SELL` | Panic selling |
| `ngmi` | Bearish resignation |
| `gm` | Greeting |
| `wen moon?` | Impatient optimism |
| `DON'T NUKE THE CHART` | D3SK signature phrase |
| `ZERO CUSTODY` | D3SK value proposition |

---

## Mascots

Two animal silhouettes represent market sentiment.

### BULL (bullish)
- Color: `#00ff41` (D3SK green)
- Simple silhouette: rectangular body, triangular head, two horn rects pointing up
- Size: 48×36 px
- Placement: Near green charts, celebrating traders

### BEAR (bearish)
- Color: `#ff0055` (D3SK red)
- Simple silhouette: rectangular body, rounded head (rect with smaller rect ears), hunched posture
- Size: 48×40 px
- Placement: Near red charts, panicking traders

---

## Scene Objects

### Trading Desk
- 2 rects: horizontal surface (48×4 px) + vertical support (4×20 px)
- Color: `#3d3d5c` (border color)
- Can hold monitors, laptops, coffee cups

### Monitor
- Outer frame: 20×16 px rect, `#3d3d5c` border
- Screen: 16×12 px rect, `#1a1a2e` fill
- Chart line: 2px polyline, green `#00ff41` or red `#ff0055`
- Stand: 4×6 px rect below

### Ticker Board (wall-mounted)
- Background: `#1a1a2e` rect
- Text: monospace 8px, green for up, red for down
- Scrolling effect: multiple ticker entries side by side

### Chair
- Seat: 16×4 px horizontal rect
- Back: 4×20 px vertical rect
- Color: `#2d2d44`

---

## Color Reference (D3SK Palette)

| Name | Hex | Usage |
|---|---|---|
| Background | `#0f0e17` | Scene floor, deep background |
| Surface | `#1a1a2e` | Monitor screens, desk surfaces |
| Border | `#3d3d5c` | Outlines, structural elements |
| Green | `#00ff41` | Bullish, D3SK brand, positive |
| Cyan | `#00e5ff` | Info, secondary highlights |
| Red | `#ff0055` | Bearish, warnings, danger |
| Yellow | `#ffd700` | Attention, special callouts |
| Accent | `#9945ff` | Purple accents, degens |
| Text | `#e8e8e8` | Light text, shirt color |
| Muted | `#6b7280` | Secondary text, shadows |

---

## Naming Convention

Characters can be given names for reference in code and documentation:

**Pattern**: `[ROLE]-[OUTFIT]-[POSE]`

Examples:
- `whale-vest-pointing` — Blue vest bro pointing at chart
- `degen-hoodie-sitting` — Purple hoodie trader at laptop
- `d3sk-suit-celebrating` — Green jacket team member, arms up
- `bear-suspenders-phonecall` — Red-accented vet yelling on phone
- `intern-polo-standing` — Wide-eyed newbie with clipboard

---

## SVG Template

```svg
<!-- Character: [name] -->
<g transform="translate(X, Y)">
  <!-- Hair -->
  <rect x="6" y="-4" width="20" height="8" fill="[HAIR_COLOR]" />
  <!-- Head -->
  <rect x="6" y="0" width="20" height="20" fill="[SKIN_TONE]" />
  <!-- Eyes -->
  <rect x="10" y="8" width="4" height="4" fill="#1a1a2e" />
  <rect x="18" y="8" width="4" height="4" fill="#1a1a2e" />
  <!-- Body -->
  <rect x="4" y="20" width="24" height="28" fill="[OUTFIT_COLOR]" />
  <!-- Arms -->
  <rect x="0" y="20" width="4" height="24" fill="[SKIN_TONE]" />
  <rect x="28" y="20" width="4" height="24" fill="[SKIN_TONE]" />
  <!-- Legs -->
  <rect x="6" y="48" width="8" height="24" fill="[PANTS_COLOR]" />
  <rect x="18" y="48" width="8" height="24" fill="[PANTS_COLOR]" />
  <!-- Shoes -->
  <rect x="4" y="68" width="10" height="4" fill="#1a1a2e" />
  <rect x="18" y="68" width="10" height="4" fill="#1a1a2e" />
</g>
```

Adjust `transform="translate(X, Y)"` to position characters in the scene. Y should account for the character's 76px height relative to the floor line.
