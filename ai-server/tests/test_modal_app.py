"""Pins the honesty contract for the Modal app skeleton: every generation
function must raise NotImplementedError rather than fabricate a result,
until real model weights and a ComfyUI image are wired in.

`.local()` runs the function body in-process (no Modal account or GPU
needed), which is enough to verify the contract without deploying.
"""

import pytest

from modal_app.app import (
    generate_audio,
    generate_image,
    generate_video,
    generate_voice,
    lip_sync,
)


@pytest.mark.parametrize(
    "fn",
    [generate_video, generate_image, generate_audio, generate_voice, lip_sync],
)
def test_generation_function_is_honestly_not_implemented(fn):
    with pytest.raises(NotImplementedError):
        fn.local(job_id="00000000-0000-0000-0000-000000000000", model_id="wan-2.2", workflow_id="w", input={})
