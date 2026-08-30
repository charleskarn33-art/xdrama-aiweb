-- Seed the initial AI model registry (section 6/7 of the architecture spec).
-- This is catalog data, not infrastructure state — enabling/disabling a
-- model here does not install or remove anything on Modal; it only
-- controls whether the AI Router may select it.

insert into public.ai_models (
  id, name, provider, version, type, description, capabilities,
  minimum_vram_gb, recommended_vram_gb, supported_resolutions, supported_fps,
  maximum_duration_seconds, input_types, output_types, status, enabled, priority, cost_multiplier
) values
  ('wan-2.2', 'Wan 2.2', 'modal', '2.2', 'video',
    'General-purpose cinematic video model.',
    array['text_to_video', 'image_to_video', 'cinematic_video'],
    24, 48, array['720p', '1080p'], array[24, 30], 10,
    array['text', 'image'], array['video'], 'active', true, 10, 1.0),

  ('skyreels-v2', 'SkyReels V2', 'modal', '2', 'video',
    'Character-consistent cinematic video model.',
    array['character_consistency', 'cinematic_video'],
    24, 48, array['720p', '1080p'], array[24], 10,
    array['text', 'image'], array['video'], 'active', true, 20, 1.2),

  ('hunyuan-video', 'HunyuanVideo', 'modal', '1', 'video',
    'Human performance and motion-focused video model.',
    array['human_performance', 'text_to_video'],
    40, 80, array['720p', '1080p'], array[24], 8,
    array['text'], array['video'], 'active', true, 30, 1.3),

  ('cogvideox', 'CogVideoX', 'modal', '1', 'video',
    'Image-to-video generation model.',
    array['image_to_video', 'text_to_video'],
    16, 24, array['720p'], array[8, 16], 6,
    array['text', 'image'], array['video'], 'active', true, 40, 0.9),

  ('open-sora', 'Open-Sora', 'modal', '1.2', 'video',
    'Long-form open video generation model.',
    array['text_to_video', 'long_form_video'],
    24, 48, array['720p'], array[24], 15,
    array['text'], array['video'], 'beta', true, 50, 1.1),

  ('ltx-video', 'LTX Video', 'modal', '1', 'video',
    'Fast low-latency preview video model.',
    array['text_to_video', 'fast_preview'],
    8, 16, array['480p', '720p'], array[24, 30], 5,
    array['text', 'image'], array['video'], 'active', true, 5, 0.5),

  ('stable-video-diffusion', 'Stable Video Diffusion', 'modal', '1.1', 'video',
    'Image-to-video diffusion model.',
    array['image_to_video'],
    16, 24, array['576p'], array[7, 25], 4,
    array['image'], array['video'], 'active', true, 60, 0.8),

  ('flux', 'FLUX', 'modal', '1', 'image',
    'High-fidelity text-to-image model.',
    array['text_to_image'],
    16, 24, array['1024p', '2048p'], array[]::int[], null,
    array['text'], array['image'], 'active', true, 10, 1.0),

  ('sdxl', 'Stable Diffusion XL', 'modal', '1.0', 'image',
    'General-purpose text-to-image model.',
    array['text_to_image', 'image_to_image'],
    8, 16, array['1024p'], array[]::int[], null,
    array['text', 'image'], array['image'], 'active', true, 20, 0.7),

  ('musicgen', 'MusicGen', 'modal', '1', 'audio',
    'Text-to-music generation model.',
    array['text_to_music'],
    8, 16, array[]::text[], array[]::int[], 120,
    array['text'], array['audio'], 'active', true, 10, 1.0),

  ('audiocraft', 'AudioCraft', 'modal', '1', 'audio',
    'General audio generation model.',
    array['text_to_audio', 'sound_effects'],
    8, 16, array[]::text[], array[]::int[], 60,
    array['text'], array['audio'], 'active', true, 20, 1.0),

  ('stable-audio-open', 'Stable Audio Open', 'modal', '1', 'audio',
    'Open text-to-audio model.',
    array['text_to_music', 'text_to_audio'],
    8, 16, array[]::text[], array[]::int[], 180,
    array['text'], array['audio'], 'active', true, 30, 0.8),

  ('kokoro', 'Kokoro', 'modal', '1', 'tts',
    'Lightweight fast text-to-speech model.',
    array['text_to_speech'],
    2, 4, array[]::text[], array[]::int[], null,
    array['text'], array['audio'], 'active', true, 10, 0.5),

  ('piper', 'Piper', 'modal', '1', 'tts',
    'Local-friendly text-to-speech model.',
    array['text_to_speech'],
    1, 2, array[]::text[], array[]::int[], null,
    array['text'], array['audio'], 'active', true, 20, 0.4),

  ('coqui-tts', 'Coqui TTS', 'modal', '1', 'tts',
    'Multi-speaker text-to-speech model.',
    array['text_to_speech', 'voice_cloning'],
    4, 8, array[]::text[], array[]::int[], null,
    array['text'], array['audio'], 'active', true, 30, 0.7),

  ('musetalk', 'MuseTalk', 'modal', '1', 'lip_sync',
    'Real-time lip-sync model.',
    array['lip_sync'],
    8, 16, array['720p'], array[25], null,
    array['video', 'audio'], array['video'], 'active', true, 10, 1.0),

  ('latentsync', 'LatentSync', 'modal', '1', 'lip_sync',
    'High-fidelity lip-sync diffusion model.',
    array['lip_sync'],
    16, 24, array['720p', '1080p'], array[25], null,
    array['video', 'audio'], array['video'], 'beta', true, 20, 1.3),

  ('qwen', 'Qwen', 'modal', '2.5', 'llm',
    'Script analysis and reasoning LLM.',
    array['script_analysis', 'reasoning', 'prompt_generation'],
    16, 24, array[]::text[], array[]::int[], null,
    array['text'], array['text'], 'active', true, 10, 1.0),

  ('llama', 'Llama', 'modal', '3.1', 'llm',
    'General-purpose reasoning LLM.',
    array['script_analysis', 'reasoning', 'prompt_generation'],
    16, 24, array[]::text[], array[]::int[], null,
    array['text'], array['text'], 'active', true, 20, 1.0),

  ('deepseek', 'DeepSeek', 'modal', '3', 'llm',
    'Reasoning-focused LLM for script analysis.',
    array['script_analysis', 'reasoning'],
    16, 48, array[]::text[], array[]::int[], null,
    array['text'], array['text'], 'active', true, 30, 1.0)
on conflict (id) do nothing;
