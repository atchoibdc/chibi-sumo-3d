# Custom 3D Sumo Model (Optional `.glb` Override)

By default, **tinukMurai!** renders a built-in 1:1 procedural 3D sculpt matching the **Chibi Sumo #1** turnaround reference sheet.

If you generate or export a `.glb` 3D mesh (for example via Blender, Meshy, Tripo3D, or Rodin from the turnaround sheet), drop it directly here as:

```text
public/models/chibi-sumo.glb
```

## Automatic Integration Behavior
- **Zero-config loading**: Detected automatically on startup (`./models/chibi-sumo.glb`, compatible with GitHub Pages).
- **Scale & Grounding**: Automatically scaled to `2.36m` tall with feet planted squarely at `y = 0` on the Dohyo clay.
- **Per-Wrestler Mawashi Colors**: Automatically re-colors either submeshes named `mawashi` / `belt` **or** red mawashi pixels on single-texture baked meshes to each wrestler's roster color!
- **Orientation Tweak**: If your `.glb` faces backward (`-Z` instead of `+Z`), adjust `rotationYOffset: Math.PI` in `src/modelLoader.js`.

