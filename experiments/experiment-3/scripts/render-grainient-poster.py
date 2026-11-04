#!/usr/bin/env python3
"""Render production Grainient shaders with installed Mesa EGL (not a browser).

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
SOURCE = ROOT / 'src/vendor/Grainient.jsx'
WRAPPER = ROOT / 'src/components/MineralAtmosphere.jsx'
WIDTH, HEIGHT = 960, 600
OUT = ROOT / 'review/render-grainient-native.png'
META = ROOT / 'review/render-grainient-native.json'

source = SOURCE.read_text()
wrapper = WRAPPER.read_text()
shaders = {name: re.search(rf'const {name} = `([\s\S]*?)`;', source).group(1)
           for name in ('VERTEX', 'FIELD', 'COMPOSITE')}
colors = re.findall(r"#[0-9a-fA-F]{6}", re.search(r'MINERAL_COLORS=\[(.*?)\]', wrapper).group(1))
props = {}
for name, literal in re.findall(r'(\w+)=\{(-?[\d.]+|true|false)\}', wrapper):
    props[name] = json.loads(literal) if literal in ('true', 'false') else float(literal)
props['colors'] = colors
props['type'] = re.search(r'type="([^"]+)"', wrapper).group(1)
assert all(props[name] == expected for name, expected in {
    'speed': 0, 'grainAnimated': False, 'interactive': False,
    'clickSwirl': False, 'intro': False,
}.items()), 'This renderer models the static wrapper configuration only.'

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
        attach_shader(result, vertex); attach_shader(result, fragment); link_program(result)
        status = integer()
        get_program(result, 0x8B82, C.byref(status))
        log = C.create_string_buffer(16384)
        program_log(result, len(log), None, log)
        assert status.value, f'Program link failed: {log.value.decode()}'
        delete_shader(vertex); delete_shader(fragment)
        return result

    field = program(shaders['FIELD'])
    composite = program(shaders['COMPOSITE'])
    gen_textures = gl_fn('glGenTextures', None, integer, C.POINTER(uint))
    bind_texture = gl_fn('glBindTexture', None, uint, uint)
    tex_parameter = gl_fn('glTexParameteri', None, uint, uint, integer)
    tex_image = gl_fn('glTexImage2D', None, uint, integer, integer, integer, integer, integer, uint, uint, ptr)
    gen_framebuffers = gl_fn('glGenFramebuffers', None, integer, C.POINTER(uint))
    bind_framebuffer = gl_fn('glBindFramebuffer', None, uint, uint)
    framebuffer_texture = gl_fn('glFramebufferTexture2D', None, uint, uint, uint, uint, integer)
    check_framebuffer = gl_fn('glCheckFramebufferStatus', uint, uint)
    gen_vertex_arrays = gl_fn('glGenVertexArrays', None, integer, C.POINTER(uint))
    bind_vertex_array = gl_fn('glBindVertexArray', None, uint)
    viewport = gl_fn('glViewport', None, integer, integer, integer, integer)
    draw = gl_fn('glDrawArrays', None, uint, integer, integer)
    disable = gl_fn('glDisable', None, uint)
    active_texture = gl_fn('glActiveTexture', None, uint)
    read_pixels = gl_fn('glReadPixels', None, integer, integer, integer, integer, uint, uint, ptr)
    finish = gl_fn('glFinish', None)
    texture, buffer, vao = uint(), uint(), uint()
    gen_textures(1, C.byref(texture)); bind_texture(0x0DE1, texture)
    for name, value in [(0x2801, 0x2601), (0x2800, 0x2601), (0x2802, 0x812F), (0x2803, 0x812F)]:
        tex_parameter(0x0DE1, name, value)
    ratio = min(props['dpr'], 2, math.sqrt(props['maxPixels'] / (WIDTH * HEIGHT)))
    canvas_width, canvas_height = math.floor(WIDTH * ratio), math.floor(HEIGHT * ratio)
    assert (canvas_width, canvas_height) == (WIDTH, HEIGHT), 'Requested output exceeds the wrapper budget.'
    field_width, field_height = round(WIDTH / 2), round(HEIGHT / 2)
    tex_image(0x0DE1, 0, 0x8058, field_width, field_height, 0, 0x1908, 0x1401, None)
    gen_framebuffers(1, C.byref(buffer)); bind_framebuffer(0x8D40, buffer)
    framebuffer_texture(0x8D40, 0x8CE0, 0x0DE1, texture, 0)
    assert check_framebuffer(0x8D40) == 0x8CD5, 'Field framebuffer is incomplete.'
    gen_vertex_arrays(1, C.byref(vao)); bind_vertex_array(vao)
    disable(0x0BE2)

    def lab(hex_color):
        rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        r, g, b = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb]
        l = math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b)
        m = math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b)
        s = math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b)
        return [.2104542553*l + .793617785*m - .0040720468*s,
                1.9779984951*l - 2.428592205*m + .4505937099*s,
                .0259040371*l + .7827717662*m - .808675766*s]

    use_program(field)
    loc = lambda name: uniform_location(field, name.encode())
    ramp = [v for color in colors for v in lab(color)] + [0.] * (3 * (8 - len(colors)))
    uniform3fv(loc('uRamp[0]'), 8, (floating * len(ramp))(*ramp))
    uniform1i(loc('uCount'), len(colors)); uniform1i(loc('uType'), 0 if props['type'] == 'linear' else 1)
    angle = props['angle'] * math.pi / 180
    uniform2f(loc('uDir'), math.sin(angle), math.cos(angle))
    uniform2f(loc('uSeed'), props['variation'] * 3.17, props['variation'] * 1.91)
    for name, value in {
        'uAspect': WIDTH / HEIGHT, 'uTime': 0, 'uExtent': WIDTH / HEIGHT * abs(math.sin(angle)) + abs(math.cos(angle)),
        'uBands': props['bands'], 'uSoftness': props['softness'], 'uFlow': props['flow'],
        'uScale': props['scale'], 'uSilk': props['silk'], 'uContrast': props['contrast'],
        'uSaturation': props['saturation'], 'uSettle': 1, 'uReveal': 1,
    }.items(): uniform1f(loc(name), value)
    uniform4fv(loc('uStir[0]'), 24, (floating * 96)())
    uniform1fv(loc('uStirWeight[0]'), 24, (floating * 24)())
    uniform4fv(loc('uTwirl[0]'), 4, (floating * 16)())
    viewport(0, 0, field_width, field_height); draw(0x0004, 0, 3)
    assert gl_error() == 0, 'GL error during field pass.'

    bind_framebuffer(0x8D40, 0); viewport(0, 0, WIDTH, HEIGHT)
    use_program(composite); active_texture(0x84C0); bind_texture(0x0DE1, texture)
    loc = lambda name: uniform_location(composite, name.encode())
    uniform1i(loc('uField'), 0)
    uniform1f(loc('uGrain'), props['grainAmount'])
    uniform1f(loc('uGrainSize'), props['grainSize'] * ratio)
    uniform1f(loc('uFrame'), 0)
    draw(0x0004, 0, 3); finish()
    assert gl_error() == 0, 'GL error during composite pass.'
    pixels = (C.c_ubyte * (WIDTH * HEIGHT * 4))()
    read_pixels(0, 0, WIDTH, HEIGHT, 0x1908, 0x1401, pixels)
    assert gl_error() == 0, 'GL error reading pixels.'
    image = Image.frombytes('RGBA', (WIDTH, HEIGHT), bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB')
    assert all(high > low for low, high in image.getextrema()), 'Unexpected uniform/empty render.'
    image.save(OUT)
    metadata = {
        'kind': 'native offscreen shader unit render; not browser GPU or visual integration testing',
        'implementation': 'Python ctypes calling already installed Mesa EGL, surfaceless OpenGL ES3 pbuffer',
        'context': info, 'egl_version': f'{major.value}.{minor.value}',
        'dimensions': [WIDTH, HEIGHT], 'field_dimensions': [field_width, field_height],
        'source': str(SOURCE.relative_to(ROOT)), 'wrapper': str(WRAPPER.relative_to(ROOT)),
        'shader_sha256': {name: hashlib.sha256(text.encode()).hexdigest() for name, text in shaders.items()},
        'props': props, 'static_uniforms': {'uTime': 0, 'uFrame': 0, 'uSettle': 1, 'uReveal': 1},
        'rgb_extrema': image.getextrema(), 'elapsed_seconds': round(time.perf_counter() - started, 3),
        'output': str(OUT.relative_to(ROOT)),
    }
    META.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n')
    for name, value in [('glDeleteTextures', texture), ('glDeleteFramebuffers', buffer), ('glDeleteVertexArrays', vao)]:
        gl_fn(name, None, integer, C.POINTER(uint))(1, C.byref(value))
    delete_program(field); delete_program(composite)
    print(json.dumps(metadata, ensure_ascii=False), flush=True)
finally:
    make_current(display, None, None, None)
    if context: destroy_context(display, context)
    if surface: destroy_surface(display, surface)
    terminate(display)
