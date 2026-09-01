# AI Workflows

Workflow definitions live here, separate from application code, so they can
be versioned and edited without a frontend deploy. Each workflow directory
contains a `metadata.json` describing the workflow (spec section 10) and a
`comfyui_workflow.json` — the actual ComfyUI graph the orchestrator submits.

```
ai/workflows/<category>/<workflow-id>/
  metadata.json          # id, version, model requirements, inputs, outputs, parameters
  comfyui_workflow.json  # ComfyUI API-format workflow graph (added as models are wired up)
```

`metadata.json` shape:

```jsonc
{
  "id": "text-to-video.cinematic-v1",
  "name": "Cinematic Text-to-Video",
  "category": "text-to-video",
  "version": "1",
  "status": "active",
  "modelRequirements": {
    "type": "video",
    "capabilities": ["text_to_video", "cinematic_video"]
  },
  "inputs": {
    "prompt": { "type": "string", "required": true },
    "negativePrompt": { "type": "string", "required": false },
    "resolution": { "type": "string", "enum": ["720p", "1080p"], "default": "1080p" },
    "fps": { "type": "number", "enum": [24, 30], "default": 24 },
    "durationSeconds": { "type": "number", "minimum": 1, "maximum": 10, "default": 5 },
    "seed": { "type": "number", "required": false }
  },
  "outputs": {
    "video": { "type": "video", "format": "mp4" }
  }
}
```

ComfyUI is never exposed to users or the public internet (spec sections 9,
66) — only the AI orchestrator reads these files and submits the graph to
ComfyUI on Modal.

Category directories provisioned in Sprint 1 (empty until Sprint 3 wires up
real ComfyUI graphs):

- `text-to-video/`
- `image-to-video/`
- `character-consistency/`
- `cinematic/`
- `drama/`
- `trailer/`
- `music-video/`
