---
title: "Sharing the island"
description: "The Share my island button, a public link with a preview image."
---

# Sharing the island

**Home → Share my island** creates a public link like `/i/Ab3dEf9hJk` that shows a pop-up with the user's island, **first name** and **level**, and a button **"Start saving for your pension"**. Nothing else is shared: no days, no money, no surname.

## How it works

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as createShareLink()
  participant DB as share_links
  participant F as share-images bucket
  B->>B: wait 2 frames, snapshot the 3D canvas
  B->>B: draw a 1200×630 card: island + name + level
  B->>A: PNG
  A->>F: upload CODE.png (public)
  A->>DB: upsert code, first name, level, slots
  A-->>B: /i/CODE
  B->>B: phone: share sheet · desktop: WhatsApp, LinkedIn, Copy link
```

- The canvas keeps its last frame (`preserveDrawingBuffer`) so it can be photographed.
- One link per user; sharing again updates the picture and level.
- `/i/[code]` is public, rendered on the server, with **Open Graph** tags so WhatsApp and LinkedIn show the preview image.
- The table has no public read policy: the page reads it with the server's admin client and returns only the safe columns.
