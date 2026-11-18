# DFD viewer

A small, self-contained page that renders the day planner and fleet records data flow diagrams from raw Mermaid files. You can drill down from one level to the next, check balancing against the parent level, and copy the markup.

## Files

```text
dfd-viewer/
├── index.html                  The viewer (HTML, CSS and JavaScript in one file)
└── dfd/
    ├── level-0-context.mmd     Context diagram
    ├── level-1.mmd             Level 1
    └── level-2-process-3.mmd   Level 2, process 3 Maintain fleet records
```

The `.mmd` files are the source of truth. Edit one and the viewer shows the change on the next load. They also render as they are on GitHub and in the Mermaid Live Editor.

## Adding it to the Astro site

The viewer is static: one HTML page and three text files. It needs no database, no server code and no Astro components.

1. Copy the `dfd-viewer` folder to `public/demos/dfd-viewer/` in the site project, beside the planner's `/demos/charging-planner/`.
2. Astro copies `public/` unchanged, so after the next deployment the viewer is at `/demos/dfd-viewer/` and the raw files at `/demos/dfd-viewer/dfd/level-1.mmd` and so on.
3. Link to it from the article, for example `/demos/dfd-viewer/#level-1`.

To show one diagram inside the article without the navigation and tabs, embed it with `?embed`:

```html
<iframe src="/demos/dfd-viewer/?embed#level-2-process-3"
        title="Level 2 data flow diagram for process 3, Maintain fleet records"
        style="width:100%;height:720px;border:0"></iframe>
```

**What it loads from elsewhere.** Mermaid and its ELK layout come from the jsDelivr CDN, and the fonts from Google Fonts. If the site ever adds a Content Security Policy, allow `cdn.jsdelivr.net`, `fonts.googleapis.com` and `fonts.gstatic.com`. The diagrams' source of truth stays in the analysis project; copy the `.mmd` files across again when they change.

## Viewing it locally

Browsers will not let a page read neighbouring files when it is opened straight from disk. Run a local server in the folder instead:

```bash
npx serve public/demos/dfd-viewer
```

`npm run dev` in the Astro project also serves it, at `http://localhost:4321/demos/dfd-viewer/`.

## How it works

- Mermaid 12 and its ELK layout engine load from the jsDelivr CDN. ELK works out where everything goes and routes the flows with square corners.
- The viewer then redraws each node in the notation of Britton and Doake's *Software System Development: A Gentle Introduction*:
  - external entities as ovals
  - processes as boxes with the process number in a cell at the top left
  - data stores as boxes open at the right-hand end, with the store number in a cell at the left
  - a dashed boundary around the system (Level 1) or around the process being decomposed (Level 2)
- Flows are redrawn as straight, square-cornered lines from Mermaid's route points, and those that meet an oval end on its edge.
- The viewer reads each node's type from the markup: `X[...]` is an external entity, `X(...)` or `X((...))` a process and `X[(...)]` a data store. The raw files stay free of styling, so they still render on GitHub in Mermaid's own shapes.
- **Book-style names** shows flows as joined words (`ChargeInstruction`, `Battery&ChargerDetails`) and stores in capitals joined by underscores (`CHARGE_SESSIONS`), as in the book. **Black and white** removes the colour for printing. Both choices are remembered in the browser.
- A process with a lower-level diagram has a dark number cell and border, and can be selected to drill down.
- **Down** and **Across** change the layout direction for the current view only. The default comes from the `flowchart TB` or `flowchart LR` line in each file.
- The balancing check compares the flows into and out of the parent process with the flows that cross the boundary of the lower-level diagram. It also checks that no flow runs directly between entities and stores.

## Adding a diagram

1. Add the `.mmd` file to `dfd/`.
2. Add one line to the `DIAGRAMS` list near the top of the script in `index.html`, giving the parent diagram and the process it decomposes. For example:

```js
{ id: "level-2-process-2", label: "Level 2", title: "Process 2, Build day plan",
  file: "dfd/level-2-process-2.mmd", parent: "level-1", parentProcess: "P2", depth: 2 },
```

Process 2 on Level 1 then turns dark green and links to the new diagram.

## Notation

The viewer draws the Britton and Doake notation described above. In the raw files the same elements are written with Mermaid's shapes: rectangles for external entities, rounded boxes for processes and cylinders for data stores. A dotted line is an optional flow. Data only moves between entities and stores through a process.
