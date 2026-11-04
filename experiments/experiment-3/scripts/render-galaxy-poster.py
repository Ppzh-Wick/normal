#!/usr/bin/env python3
"""Render production Galaxy shaders with installed Mesa EGL (not a browser).

No extra package or driver installation is performed. The existing Pillow module
encodes the result. This is an offscreen shader unit render, not browser GPU QA.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import hashlib
import json
import math
import os
import re
import time
from PIL import Image

# This affects only this native test process, and avoids driver cache writes
# outside the workspace. It does not alter browser or machine settings.
os.environ.setdefault('MESA_SHADER_CACHE_DISABLE', 'true')

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'reference/Galaxy.jsx'
VENDOR = ROOT / 'src/vendor/Galaxy.jsx'
WRAPPER = ROOT / 'src/components/GalaxyAtmosphere.jsx'
WIDTH, HEIGHT = 960, 600
OUT = ROOT / 'review/galaxy-native.png'
META = ROOT / 'docs/galaxy-native-render.json'
WEBP = ROOT / 'public/images/materials/memorial-galaxy.webp'

source = SOURCE.read_text()
wrapper = WRAPPER.read_text()
raw_shaders = {name: re.search(rf'const {name} = `([\s\S]*?)`;', source).group(1)
               for name in ('VERTEX', 'FRAGMENT')}
shaders = {name: text.replace('${MAX_COLORS}', '4').replace('${MAX_LAYERS}', '8')
           for name, text in raw_shaders.items()}
shaders['FRAGMENT'] = shaders['FRAGMENT'].replace('\n', '\n#define PALETTE\n', 1)
vendor_shaders = None
if VENDOR.exists():
    vendor_source = VENDOR.read_text()
    vendor_shaders = {name: re.search(rf'const {name} = `([\s\S]*?)`;', vendor_source).group(1)
                      for name in raw_shaders}
    assert vendor_shaders == raw_shaders, 'Production shader differs from the official reference.'
colors = re.findall(r'#[0-9a-fA-F]{6}', re.search(r'MEMORIAL_STARS\s*=\s*\[(.*?)\]', wrapper).group(1))
props = {}
for name, literal in re.findall(r'(\w+)=\{(-?[\d.]+|true|false)\}', wrapper):
    props[name] = json.loads(literal) if literal in ('true', 'false') else float(literal)
for name in ('focal', 'rotation'):
    props[name] = [float(x) for x in re.search(rf'{name}=\{{\[(.*?)\]\}}', wrapper).group(1).split(',')]
props.update(starColors=colors, backgroundColor=re.search(r'backgroundColor="([^"]+)"',wrapper).group(1))
assert all(props[name] == expected for name, expected in {
    'layers': 2, 'density': .7, 'glowIntensity': .2, 'starSize': .75,
    'flareIntensity': .12, 'starSpeed': 0, 'speed': 0, 'rotationSpeed': 0,
    'twinkleIntensity': 0, 'mouseInteraction': False, 'mouseRepulsion': False,
    'clickWarp': False, 'intro': False, 'disableAnimation': True,
    'transparent': False, 'backgroundColor': '#000000', 'opacity': 1,
}.items()), 'This renderer models only the agreed static wrapper configuration.'
assert WIDTH*HEIGHT <= props['maxPixels'], 'Render exceeds production pixel budget.'
OUT.parent.mkdir(parents=True, exist_ok=True)
META.parent.mkdir(parents=True, exist_ok=True)
egl_name = ctypes.util.find_library('EGL')
if not egl_name:
    raise SystemExit('No existing EGL library is available.')
egl = C.CDLL(egl_name)

def egl_fn(name, restype, *argtypes):
    fn = getattr(egl, name)
    fn.restype, fn.argtypes = restype, argtypes
    return fn

ptr, integer, uint, floating = C.c_void_p, C.c_int, C.c_uint, C.c_float
get_proc = egl_fn('eglGetProcAddress', ptr, C.c_char_p)
get_error = egl_fn('eglGetError', uint)
initialize = egl_fn('eglInitialize', uint, ptr, C.POINTER(integer), C.POINTER(integer))
bind_api = egl_fn('eglBindAPI', uint, uint)
choose_config = egl_fn('eglChooseConfig', uint, ptr, C.POINTER(integer), C.POINTER(ptr), integer, C.POINTER(integer))
create_surface = egl_fn('eglCreatePbufferSurface', ptr, ptr, ptr, C.POINTER(integer))
create_context = egl_fn('eglCreateContext', ptr, ptr, ptr, ptr, C.POINTER(integer))
make_current = egl_fn('eglMakeCurrent', uint, ptr, ptr, ptr, ptr)
destroy_context = egl_fn('eglDestroyContext', uint, ptr, ptr)
destroy_surface = egl_fn('eglDestroySurface', uint, ptr, ptr)
terminate = egl_fn('eglTerminate', uint, ptr)
get_platform_address = get_proc(b'eglGetPlatformDisplayEXT')
if not get_platform_address:
    raise SystemExit('Existing EGL has no surfaceless platform entry point.')
get_platform_display = C.CFUNCTYPE(ptr, uint, ptr, C.POINTER(integer))(get_platform_address)
display = get_platform_display(0x31DD, None, None)  # EGL_PLATFORM_SURFACELESS_MESA
major, minor = integer(), integer()
if not display or not initialize(display, C.byref(major), C.byref(minor)):
    raise SystemExit(f'Existing surfaceless EGL initialization failed: {get_error():#x}')
surface = context = None
started = time.perf_counter()

try:
    assert bind_api(0x30A0), f'eglBindAPI: {get_error():#x}'  # EGL_OPENGL_ES_API
    attributes = (integer * 15)(
        0x3033, 1,       # EGL_SURFACE_TYPE, EGL_PBUFFER_BIT
        0x3040, 0x0040,  # EGL_RENDERABLE_TYPE, EGL_OPENGL_ES3_BIT
        0x3024, 8, 0x3023, 8, 0x3022, 8, 0x3021, 8,  # RGBA8
        0x3025, 0, 0x3038,
    )
    config, count = ptr(), integer()
    assert choose_config(display, attributes, C.byref(config), 1, C.byref(count)) and count.value, \
        f'No existing ES3 pbuffer config: {get_error():#x}'
    surface = create_surface(display, config, (integer * 5)(0x3057, WIDTH, 0x3056, HEIGHT, 0x3038))
    assert surface, f'eglCreatePbufferSurface: {get_error():#x}'
    context = create_context(display, config, None, (integer * 3)(0x3098, 3, 0x3038))
    assert context, f'eglCreateContext ES3: {get_error():#x}'
    assert make_current(display, surface, surface, context), f'eglMakeCurrent: {get_error():#x}'

    def gl_fn(name, restype, *argtypes):
        address = get_proc(name.encode())
        assert address, f'Missing installed GL entry point {name}'
        return C.CFUNCTYPE(restype, *argtypes)(address)

    get_string = gl_fn('glGetString', C.c_char_p, uint)
    gl_error = gl_fn('glGetError', uint)
    info = {name: get_string(key).decode() for name, key in {
        'vendor': 0x1F00, 'renderer': 0x1F01, 'version': 0x1F02, 'shading_language': 0x8B8C,
    }.items()}
    print(json.dumps({'native_context': info}, ensure_ascii=False), flush=True)

    create_shader = gl_fn('glCreateShader', uint, uint)
    shader_source = gl_fn('glShaderSource', None, uint, integer, C.POINTER(C.c_char_p), C.POINTER(integer))
    compile_shader = gl_fn('glCompileShader', None, uint)
    get_shader = gl_fn('glGetShaderiv', None, uint, uint, C.POINTER(integer))
    shader_log = gl_fn('glGetShaderInfoLog', None, uint, integer, C.POINTER(integer), C.c_char_p)
    create_program = gl_fn('glCreateProgram', uint)
    attach_shader = gl_fn('glAttachShader', None, uint, uint)
    link_program = gl_fn('glLinkProgram', None, uint)
    get_program = gl_fn('glGetProgramiv', None, uint, uint, C.POINTER(integer))
    program_log = gl_fn('glGetProgramInfoLog', None, uint, integer, C.POINTER(integer), C.c_char_p)
    delete_shader = gl_fn('glDeleteShader', None, uint)
    delete_program = gl_fn('glDeleteProgram', None, uint)
    use_program = gl_fn('glUseProgram', None, uint)
    uniform_location = gl_fn('glGetUniformLocation', integer, uint, C.c_char_p)
    uniform1f = gl_fn('glUniform1f', None, integer, floating)
    uniform1i = gl_fn('glUniform1i', None, integer, integer)
    uniform2f = gl_fn('glUniform2f', None, integer, floating, floating)
    uniform1fv = gl_fn('glUniform1fv', None, integer, integer, C.POINTER(floating))
    uniform3fv = gl_fn('glUniform3fv', None, integer, integer, C.POINTER(floating))
    uniform4fv = gl_fn('glUniform4fv', None, integer, integer, C.POINTER(floating))

    def compile_one(kind, text):
        shader = create_shader(kind)
        data = C.c_char_p(text.encode())
        shader_source(shader, 1, C.byref(data), None)
        compile_shader(shader)
        status = integer()
        get_shader(shader, 0x8B81, C.byref(status))
        log = C.create_string_buffer(16384)
        shader_log(shader, len(log), None, log)
        assert status.value, f'Shader compilation failed: {log.value.decode()}'
        return shader

    def program(fragment):
        vertex = compile_one(0x8B31, shaders['VERTEX'])
        fragment = compile_one(0x8B30, fragment)
        result = create_program()
        attach_shader(result, vertex); attach_shader(result, fragment)
        gl_fn('glBindAttribLocation', None, uint, uint, C.c_char_p)(result, 0, b'aPosition')
        link_program(result)
        status = integer()
        get_program(result, 0x8B82, C.byref(status))
        log = C.create_string_buffer(16384)
        program_log(result, len(log), None, log)
        assert status.value, f'Program link failed: {log.value.decode()}'
        delete_shader(vertex); delete_shader(fragment)
        return result

    shader_program = program(shaders['FRAGMENT'])
    gen_vertex_arrays = gl_fn('glGenVertexArrays', None, integer, C.POINTER(uint))
    bind_vertex_array = gl_fn('glBindVertexArray', None, uint)
    gen_buffers = gl_fn('glGenBuffers', None, integer, C.POINTER(uint))
    bind_buffer = gl_fn('glBindBuffer', None, uint, uint)
    buffer_data = gl_fn('glBufferData', None, uint, C.c_ssize_t, ptr, uint)
    enable_attrib = gl_fn('glEnableVertexAttribArray', None, uint)
    attrib_pointer = gl_fn('glVertexAttribPointer', None, uint, integer, uint, C.c_ubyte, integer, ptr)
    viewport = gl_fn('glViewport', None, integer, integer, integer, integer)
    draw = gl_fn('glDrawArrays', None, uint, integer, integer)
    disable = gl_fn('glDisable', None, uint)
    read_pixels = gl_fn('glReadPixels', None, integer, integer, integer, integer, uint, uint, ptr)
    finish = gl_fn('glFinish', None)
    vbo, vao = uint(), uint()
    gen_vertex_arrays(1, C.byref(vao)); bind_vertex_array(vao)
    gen_buffers(1, C.byref(vbo)); bind_buffer(0x8892, vbo)
    vertices = (floating * 6)(-1, -1, 3, -1, -1, 3)
    buffer_data(0x8892, C.sizeof(vertices), vertices, 0x88E4)
    enable_attrib(0); attrib_pointer(0, 2, 0x1406, 0, 0, None)
    disable(0x0BE2)
    use_program(shader_program)
    loc = lambda name: uniform_location(shader_program, name.encode())
    floats = {
        'uTime': 0, 'uGloss': 0, 'uDepth': 0, 'uDensity': props['density'],
        'uHueShift': 140, 'uSpeed': props['speed'],
        'uStarGlow': .05*props['glowIntensity']*props['starSize'],
        'uFlareGain': props['glowIntensity']*props['flareIntensity'],
        'uSquash': 0, 'uSaturation': props['saturation'],
        'uMouseRepulsion': 0, 'uTwinkleIntensity': props['twinkleIntensity'],
        'uRotationAngle': 0, 'uRepulsionStrength': 2,
        'uMouseActiveFactor': 0, 'uAutoCenterRepulsion': 0,
        'uWarp': 0, 'uReveal': 1, 'uMode': 0, 'uOpacity': props['opacity'],
    }
    vectors = {'uResolution': [WIDTH, HEIGHT], 'uFocal': props['focal'],
               'uRotation': props['rotation'], 'uMouse': [.5,.5]}
    for name, value in floats.items(): uniform1f(loc(name), value)
    for name, value in vectors.items(): uniform2f(loc(name), *value)
    uniform1i(loc('uLayers'), int(props['layers']))
    uniform1i(loc('uColorCount'), len(colors))
    rgb = lambda color: [int(color[i:i+2],16)/255 for i in (1,3,5)]
    palette = [value for color in colors for value in rgb(color)] + [0.] * (3*(4-len(colors)))
    uniform3fv(loc('uColors[0]'), 4, (floating * 12)(*palette))
    background = rgb(props['backgroundColor'])
    uniform3fv(loc('uBackground'), 1, (floating * 3)(*background))
    viewport(0, 0, WIDTH, HEIGHT)
    draw(0x0004, 0, 3); finish()
    assert gl_error() == 0, 'GL error during Galaxy render.'
    pixels = (C.c_ubyte * (WIDTH * HEIGHT * 4))()
    read_pixels(0, 0, WIDTH, HEIGHT, 0x1908, 0x1401, pixels)
    assert gl_error() == 0, 'GL error reading Galaxy pixels.'
    rgba = Image.frombytes('RGBA', (WIDTH, HEIGHT), bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    assert rgba.getchannel('A').getextrema() == (255,255), 'Expected opaque black background.'
    image = rgba.convert('RGB')
    assert all(high > low for low, high in image.getextrema()), 'Unexpected uniform/empty render.'
    image.save(OUT)
    metadata = {
        'kind': 'native offscreen shader unit render; not browser GPU, browser integration, or FPS testing',
        'implementation': 'Python ctypes calling already installed Mesa EGL, surfaceless OpenGL ES3 pbuffer and llvmpipe software rasterizer; no software installed and no browser settings changed',
        'context': info, 'egl_version': f'{major.value}.{minor.value}',
        'dimensions': [WIDTH, HEIGHT], 'pixel_count': WIDTH*HEIGHT,
        'source': str(SOURCE.relative_to(ROOT)), 'wrapper': str(WRAPPER.relative_to(ROOT)),
        'source_sha256': hashlib.sha256(source.encode()).hexdigest(),
        'wrapper_sha256': hashlib.sha256(wrapper.encode()).hexdigest(),
        'raw_shader_sha256': {name: hashlib.sha256(text.encode()).hexdigest() for name,text in raw_shaders.items()},
        'compiled_shader_sha256': {name: hashlib.sha256(text.encode()).hexdigest() for name,text in shaders.items()},
        'shader_substitutions': {'MAX_COLORS': 4, 'MAX_LAYERS': 8, 'defines': ['PALETTE']},
        'production_shader_matches_reference': vendor_shaders == raw_shaders if vendor_shaders is not None else None,
        'props': props, 'uniforms': {**floats, **vectors, 'uLayers': int(props['layers']), 'uColorCount': len(colors), 'uColors': palette, 'uBackground': background},
        'rgb_extrema': image.getextrema(), 'alpha_extrema': rgba.getchannel('A').getextrema(),
        'elapsed_seconds': round(time.perf_counter() - started, 3),
        'output': str(OUT.relative_to(ROOT)),
    }
    import sys
    if '--encode' in sys.argv:
        image.save(WEBP, format='WEBP', lossless=True, method=6)
        decoded = Image.open(WEBP).convert('RGB')
        assert decoded.tobytes() == image.tobytes(), 'Lossless WebP differs from rendered RGB.'
        metadata['webp'] = {'path': str(WEBP.relative_to(ROOT)), 'bytes': WEBP.stat().st_size, 'lossless':True, 'method':6, 'pixel_exact_to_png':True, 'sha256':hashlib.sha256(WEBP.read_bytes()).hexdigest()}
    META.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n')
    for name, value in [('glDeleteBuffers', vbo), ('glDeleteVertexArrays', vao)]:
        gl_fn(name, None, integer, C.POINTER(uint))(1, C.byref(value))
    delete_program(shader_program)
    print(json.dumps(metadata, ensure_ascii=False), flush=True)
finally:
    make_current(display, None, None, None)
    if context: destroy_context(display, context)
    if surface: destroy_surface(display, surface)
    terminate(display)
