#!/usr/bin/env python3
"""
Build original UNCLASS SAMPLE photoreal PBR GLBs for the engagement sphere.

Geometry is original (not a scan, game rip, or third-party CAD). Proportions
follow publicly published general arrangements so each stable id reads as the
right class of SAMPLE analog. Materials are baked in this script (base color,
roughness, metalness) plus an original tileable normal.

Run:
  blender -b -P source/tools/build_sphere_assets.py
  ONLY=sphere-mbt blender -b -P source/tools/build_sphere_assets.py
"""

from __future__ import annotations

import array
import math
import os
import sys

import bpy
import bmesh
import mathutils

OUT_DIR = os.environ.get("SPHERE_OUT", "/tmp/sphere-glb-raw")
PREVIEW = os.environ.get("PREVIEW", "0") == "1"
ONLY = os.environ.get("ONLY", "").strip()
COLOR_SIZE = int(os.environ.get("COLOR_SIZE", "3072"))
MAP_SIZE = int(os.environ.get("MAP_SIZE", "2048"))


def P(x, up, fwd):
    """Semantic (starboard, up, forward) -> Blender (X, -forward, up)."""
    return mathutils.Vector((x, -fwd, up))


def srgb_to_linear(rgb):
    def f(u):
        return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4

    return tuple(f(c) for c in rgb)


def rgba(rgb, a=1.0):
    r, g, b = srgb_to_linear(rgb)
    return (r, g, b, a)


class Kit:
    def __init__(self):
        self.opaque = []
        self.glass = []
        self.lamps = []
        self.anchors = []

    def _link(self, obj, kind, mat):
        bpy.context.collection.objects.link(obj)
        if mat is not None:
            obj.data.materials.append(mat)
        if hasattr(obj.data, "use_auto_smooth"):
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = math.radians(48)
        bucket = {"opaque": self.opaque, "glass": self.glass, "lamp": self.lamps}[kind]
        bucket.append(obj)
        return obj

    def from_bm(self, name, bm, mat, kind="opaque", bevel=0.0):
        if bevel > 0:
            edges = [
                e
                for e in bm.edges
                if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > math.radians(38)
            ]
            if edges:
                bmesh.ops.bevel(
                    bm,
                    geom=edges,
                    offset=bevel,
                    segments=2,
                    profile=0.55,
                    affect="EDGES",
                    clamp_overlap=True,
                )
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        for face in bm.faces:
            face.smooth = True
        mesh = bpy.data.meshes.new(name)
        bm.to_mesh(mesh)
        bm.free()
        obj = bpy.data.objects.new(name, mesh)
        return self._link(obj, kind, mat)

    def box(self, name, size, center, mat, bevel=0.0, kind="opaque", pitch=0.0):
        bm = bmesh.new()
        res = bmesh.ops.create_cube(bm, size=1.0)
        sx, su, sf = size
        bmesh.ops.scale(bm, verts=res["verts"], vec=(sx, sf, su))
        if pitch:
            bmesh.ops.rotate(
                bm,
                verts=res["verts"],
                cent=(0.0, 0.0, 0.0),
                matrix=mathutils.Matrix.Rotation(-pitch, 3, "X"),
            )
        bmesh.ops.translate(bm, verts=res["verts"], vec=P(*center))
        return self.from_bm(name, bm, mat, kind, bevel)

    def cyl(self, name, radius, length, center, axis, mat, segments=28, radius2=None, kind="opaque"):
        r2 = radius if radius2 is None else radius2
        bm = bmesh.new()
        rings = []
        for end, rad in ((-0.5, radius), (0.5, r2)):
            ring = []
            along = end * length
            for i in range(segments):
                a = 2 * math.pi * i / segments
                c = math.cos(a) * rad
                s = math.sin(a) * rad
                if axis == "up":
                    pt = (c, along, s)
                elif axis == "fwd":
                    pt = (c, s, along)
                else:
                    pt = (along, c, s)
                ring.append(bm.verts.new(P(center[0] + pt[0], center[1] + pt[1], center[2] + pt[2])))
            rings.append(ring)
        n = segments
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((rings[0][i], rings[0][j], rings[1][j], rings[1][i]))
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[1])
        return self.from_bm(name, bm, mat, kind, bevel=0.0)

    def lathe(self, name, axis, profile, center, mat, segments=36, kind="opaque"):
        """profile: list of (radius, offset along axis) relative to center."""
        bm = bmesh.new()
        rings = []
        for radius, along in profile:
            ring = []
            for i in range(segments):
                a = 2 * math.pi * i / segments
                c = math.cos(a) * radius
                s = math.sin(a) * radius
                if axis == "up":
                    pt = (c, along, s)
                elif axis == "fwd":
                    pt = (c, s, along)
                else:
                    pt = (along, c, s)
                ring.append(bm.verts.new(P(center[0] + pt[0], center[1] + pt[1], center[2] + pt[2])))
            rings.append(ring)
        n = segments
        for r in range(len(rings) - 1):
            for i in range(n):
                j = (i + 1) % n
                try:
                    bm.faces.new((rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i]))
                except ValueError:
                    pass
        if rings[0] and profile[0][0] < 1e-4:
            pass
        else:
            try:
                bm.faces.new(list(reversed(rings[0])))
            except ValueError:
                pass
        if profile[-1][0] >= 1e-4:
            try:
                bm.faces.new(rings[-1])
            except ValueError:
                pass
        return self.from_bm(name, bm, mat, kind)

    def loft(self, name, rings, mat, cap=True):
        """rings: list of semantic (x, up, fwd) point lists, equal length."""
        bm = bmesh.new()
        verts = [[bm.verts.new(P(*p)) for p in ring] for ring in rings]
        n = len(rings[0])
        for r in range(len(rings) - 1):
            for i in range(n):
                j = (i + 1) % n
                try:
                    bm.faces.new((verts[r][i], verts[r][j], verts[r + 1][j], verts[r + 1][i]))
                except ValueError:
                    pass
        if cap:
            try:
                bm.faces.new(list(reversed(verts[0])))
            except ValueError:
                pass
            try:
                bm.faces.new(verts[-1])
            except ValueError:
                pass
        return self.from_bm(name, bm, mat)

    def anchor(self, anchor_id, x, up, fwd):
        obj = bpy.data.objects.new(f"anchor:{anchor_id}", None)
        obj.empty_display_type = "SPHERE"
        obj.empty_display_size = 0.08
        obj.location = P(x, up, fwd)
        bpy.context.collection.objects.link(obj)
        self.anchors.append(obj)
        return obj

    def label(self, text, center, size, mat, extrude=0.012):
        bpy.ops.object.text_add(location=P(*center))
        obj = bpy.context.active_object
        obj.data.body = text
        obj.data.size = size
        obj.data.extrude = extrude
        obj.data.align_x = "CENTER"
        obj.data.align_y = "CENTER"
        obj.data.resolution_u = 2
        bpy.ops.object.convert(target="MESH")
        obj = bpy.context.active_object
        if mat.name not in [m.name for m in obj.data.materials]:
            obj.data.materials.append(mat)
        self.opaque.append(obj)
        return obj

    def elevate(self, objects, pivot, elev_rad):
        """Rotate meshes about the starboard axis so +forward swings toward +up."""
        pivot_b = P(*pivot)
        angle = -elev_rad
        rot = mathutils.Matrix.Rotation(angle, 4, "X")
        xform = mathutils.Matrix.Translation(pivot_b) @ rot @ mathutils.Matrix.Translation(-pivot_b)
        for obj in objects:
            obj.data.transform(xform)
            obj.data.update()


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def mix_float(nodes, links, factor_socket, a, b):
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "FLOAT"
    links.new(factor_socket, mix.inputs[0])
    if isinstance(a, float):
        mix.inputs[2].default_value = a
    else:
        links.new(a, mix.inputs[2])
    if isinstance(b, float):
        mix.inputs[3].default_value = b
    else:
        links.new(b, mix.inputs[3])
    return mix.outputs[0]


def paint_material(name, color, roughness=0.48, metallic=0.02, dirt=0.4, coat=0.2):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Coat Roughness"].default_value = 0.38
    bsdf.inputs["Specular IOR Level"].default_value = 0.42

    geom = nodes.new("ShaderNodeNewGeometry")
    sep = nodes.new("ShaderNodeSeparateXYZ")
    links.new(geom.outputs["Position"], sep.inputs["Vector"])

    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.4
    noise.inputs["Detail"].default_value = 9.0
    noise.inputs["Roughness"].default_value = 0.62

    fine = nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 18.0
    fine.inputs["Detail"].default_value = 4.0

    base = nodes.new("ShaderNodeMixRGB")
    base.blend_type = "MULTIPLY"
    base.inputs["Fac"].default_value = 0.28
    base.inputs["Color1"].default_value = rgba(color)
    links.new(noise.outputs["Color"], base.inputs["Color2"])

    dirt_amt = nodes.new("ShaderNodeMapRange")
    dirt_amt.inputs["From Min"].default_value = 0.05
    dirt_amt.inputs["From Max"].default_value = 1.35
    dirt_amt.inputs["To Min"].default_value = dirt
    dirt_amt.inputs["To Max"].default_value = 0.0
    dirt_amt.clamp = True
    links.new(sep.outputs["Z"], dirt_amt.inputs["Value"])

    dirt_mix = nodes.new("ShaderNodeMixRGB")
    dirt_mix.blend_type = "MIX"
    links.new(dirt_amt.outputs["Result"], dirt_mix.inputs["Fac"])
    links.new(base.outputs["Color"], dirt_mix.inputs["Color1"])
    dirt_mix.inputs["Color2"].default_value = rgba((0.28, 0.22, 0.14))

    chips = nodes.new("ShaderNodeMapRange")
    chips.inputs["From Min"].default_value = 0.46
    chips.inputs["From Max"].default_value = 0.72
    chips.inputs["To Min"].default_value = 0.0
    chips.inputs["To Max"].default_value = 1.0
    chips.clamp = True
    links.new(geom.outputs["Pointiness"], chips.inputs["Value"])

    chip_mix = nodes.new("ShaderNodeMixRGB")
    links.new(chips.outputs["Result"], chip_mix.inputs["Fac"])
    links.new(dirt_mix.outputs["Color"], chip_mix.inputs["Color1"])
    chip_mix.inputs["Color2"].default_value = rgba((0.55, 0.5, 0.42))
    links.new(chip_mix.outputs["Color"], bsdf.inputs["Base Color"])

    rough_noise = nodes.new("ShaderNodeMapRange")
    rough_noise.inputs["From Min"].default_value = 0.0
    rough_noise.inputs["From Max"].default_value = 1.0
    rough_noise.inputs["To Min"].default_value = roughness - 0.08
    rough_noise.inputs["To Max"].default_value = min(0.92, roughness + 0.16)
    links.new(fine.outputs["Fac"], rough_noise.inputs["Value"])
    links.new(rough_noise.outputs["Result"], bsdf.inputs["Roughness"])

    metal_out = mix_float(nodes, links, chips.outputs["Result"], metallic, 0.85)
    links.new(metal_out, bsdf.inputs["Metallic"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.18
    bump.inputs["Distance"].default_value = 0.004
    links.new(fine.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def flat_material(name, color, roughness, metallic, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Coat Weight"].default_value = coat
    bsdf.inputs["Specular IOR Level"].default_value = 0.5
    fine = mat.node_tree.nodes.new("ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 22.0
    fine.inputs["Detail"].default_value = 3.0
    bump = mat.node_tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.003
    mat.node_tree.links.new(fine.outputs["Fac"], bump.inputs["Height"])
    mat.node_tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def glass_material(name, color=(0.55, 0.72, 0.78)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "BLEND"
    mat.use_backface_culling = False
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba(color)
    bsdf.inputs["Roughness"].default_value = 0.04
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Alpha"].default_value = 0.38
    bsdf.inputs["Transmission Weight"].default_value = 0.72
    bsdf.inputs["IOR"].default_value = 1.45
    bsdf.inputs["Coat Weight"].default_value = 0.4
    bsdf.inputs["Specular IOR Level"].default_value = 0.6
    return mat


def lamp_material(name, color=(1.0, 0.94, 0.8), strength=6.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba(color)
    bsdf.inputs["Emission Color"].default_value = rgba(color)
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Roughness"].default_value = 0.25
    return mat


def make_normal_image(name="sample_normal", size=1024):
    img = bpy.data.images.new(name, size, size, alpha=False, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"
    px = array.array("f", [0.0]) * (size * size * 4)
    height = [0.0] * (size * size)

    def hset(x, y, v):
        height[(y % size) * size + (x % size)] = v

    for y in range(size):
        for x in range(size):
            u = x / size
            v = y / size
            n = (
                math.sin(u * 90.0) * math.sin(v * 70.0) * 0.35
                + math.sin((u + v) * 140.0) * 0.15
                + math.sin(u * 18.0 + math.sin(v * 9.0)) * 0.2
            )
            # sparse scratches
            if abs((math.sin(u * 37.0 + v * 3.0) + 1) % 0.25) < 0.004:
                n -= 0.8
            hset(x, y, n)
    for y in range(size):
        for x in range(size):
            hl = height[y * size + ((x - 1) % size)]
            hr = height[y * size + ((x + 1) % size)]
            hd = height[((y - 1) % size) * size + x]
            hu = height[((y + 1) % size) * size + x]
            dx = (hr - hl) * 1.6
            dy = (hu - hd) * 1.6
            nx, ny, nz = -dx, -dy, 1.0
            inv = 1.0 / math.sqrt(nx * nx + ny * ny + nz * nz)
            i = (y * size + x) * 4
            px[i] = nx * inv * 0.5 + 0.5
            px[i + 1] = ny * inv * 0.5 + 0.5
            px[i + 2] = nz * inv * 0.5 + 0.5
            px[i + 3] = 1.0
    img.pixels.foreach_set(px)
    img.pack()
    return img


def attach_targets(materials, image):
    nodes = []
    for mat in materials:
        node = mat.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        nodes.append((mat, node))
    return nodes


def activate(nodes, image, colorspace):
    image.colorspace_settings.name = colorspace
    for mat, node in nodes:
        node.image = image
        for n in mat.node_tree.nodes:
            n.select = False
        node.select = True
        mat.node_tree.nodes.active = node


def bake(obj, bake_type):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8 if bake_type == "AO" else 1
    scene.cycles.use_denoising = False
    scene.render.bake.use_pass_direct = False
    scene.render.bake.use_pass_indirect = False
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 8
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type=bake_type)


def multiply_ao(color_img, ao_img):
    cw, ch = color_img.size
    aw, ah = ao_img.size
    col = array.array("f", color_img.pixels)
    ao = array.array("f", ao_img.pixels)
    for y in range(ch):
        ay = min(ah - 1, y * ah // ch)
        row = ay * aw
        for x in range(cw):
            ax = min(aw - 1, x * aw // cw)
            f = 0.62 + 0.38 * ao[(row + ax) * 4]
            i = (y * cw + x) * 4
            col[i] *= f
            col[i + 1] *= f
            col[i + 2] *= f
    color_img.pixels.foreach_set(col)
    color_img.update()


def baked_material(name, color_img, rough_img, metal_img, normal_img):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Coat Weight"].default_value = 0.16
    bsdf.inputs["Coat Roughness"].default_value = 0.4
    bsdf.inputs["Specular IOR Level"].default_value = 0.46
    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UVMap"

    def tex(image, noncolor=False):
        node = nodes.new("ShaderNodeTexImage")
        node.image = image
        if noncolor:
            image.colorspace_settings.name = "Non-Color"
        else:
            image.colorspace_settings.name = "sRGB"
        links.new(uv.outputs["UV"], node.inputs["Vector"])
        return node

    c = tex(color_img, False)
    r = tex(rough_img, True)
    m = tex(metal_img, True)
    n = tex(normal_img, True)
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (7.0, 7.0, 7.0)
    links.new(uv.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], n.inputs["Vector"])
    nmap = nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = 0.65
    links.new(n.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(c.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(m.outputs["Color"], bsdf.inputs["Metallic"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    out.location = (400, 0)
    bsdf.location = (80, 0)
    return mat


def prepare_metal_emit(materials):
    saved = []
    for mat in materials:
        nt = mat.node_tree
        out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
        bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        surf = out.inputs["Surface"]
        old = surf.links[0].from_socket if surf.is_linked else None
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Strength"].default_value = 1.0
        metal_in = bsdf.inputs["Metallic"]
        if metal_in.is_linked:
            nt.links.new(metal_in.links[0].from_socket, emit.inputs["Color"])
        else:
            v = metal_in.default_value
            emit.inputs["Color"].default_value = (v, v, v, 1)
        if surf.is_linked:
            nt.links.remove(surf.links[0])
        nt.links.new(emit.outputs["Emission"], surf)
        saved.append((nt, surf, old, emit))
    return saved


def restore_surface(saved):
    for nt, surf, old, emit in saved:
        if surf.is_linked:
            nt.links.remove(surf.links[0])
        if old is not None:
            nt.links.new(old, surf)
        nt.nodes.remove(emit)


def uv_unwrap(obj):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.012, scale_to_bounds=False)
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=0.012)
    bpy.ops.object.mode_set(mode="OBJECT")


def join_opaque(objects):
    if len(objects) == 1:
        return objects[0]
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def export_glb(path, objects):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    for o in bpy.context.view_layer.objects:
        o.select_set(o in objects)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_image_format="AUTO",
    )


def render_preview(path, focus, cam_semantic):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = False
    scene.cycles.max_bounces = 4
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 720
    scene.render.film_transparent = False
    world = bpy.data.worlds.new("PreviewWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.42, 0.46, 0.5, 1)
    bg.inputs["Strength"].default_value = 0.85
    light_data = bpy.data.lights.new("Sun", "SUN")
    light_data.energy = 3.2
    light_data.angle = math.radians(8)
    sun = bpy.data.objects.new("Sun", light_data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(52), math.radians(8), math.radians(30))
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = P(*cam_semantic)
    direction = P(*focus) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(sun, do_unlink=True)
    bpy.data.objects.remove(cam, do_unlink=True)


def finish(model_id, kit, focus, preview_cam):
    materials = []
    for obj in kit.opaque:
        for mat in obj.data.materials:
            if mat and mat not in materials:
                materials.append(mat)
    joined = join_opaque(kit.opaque)
    uv_unwrap(joined)

    color = bpy.data.images.new(f"{model_id}_color", COLOR_SIZE, COLOR_SIZE, alpha=False)
    rough = bpy.data.images.new(f"{model_id}_rough", MAP_SIZE, MAP_SIZE, alpha=False)
    metal = bpy.data.images.new(f"{model_id}_metal", MAP_SIZE, MAP_SIZE, alpha=False)
    ao = bpy.data.images.new(f"{model_id}_ao", MAP_SIZE, MAP_SIZE, alpha=False)
    normal = make_normal_image(f"{model_id}_normal", 1024)
    targets = attach_targets(materials, color)

    activate(targets, color, "sRGB")
    bake(joined, "DIFFUSE")
    activate(targets, rough, "Non-Color")
    bake(joined, "ROUGHNESS")
    activate(targets, ao, "Non-Color")
    bake(joined, "AO")
    saved = prepare_metal_emit(materials)
    activate(targets, metal, "Non-Color")
    bake(joined, "EMIT")
    restore_surface(saved)
    multiply_ao(color, ao)
    color.pack()
    rough.pack()
    metal.pack()

    baked = baked_material(f"{model_id}_baked", color, rough, metal, normal)
    joined.data.materials.clear()
    joined.data.materials.append(baked)
    for poly in joined.data.polygons:
        poly.material_index = 0

    if PREVIEW:
        os.makedirs("/tmp/sphere-previews", exist_ok=True)
        render_preview(f"/tmp/sphere-previews/{model_id}.png", focus, preview_cam)

    export_objects = [joined, *kit.glass, *kit.lamps, *kit.anchors]
    path = os.path.join(OUT_DIR, f"{model_id}.glb")
    export_glb(path, export_objects)
    print(f"WROTE {path}")
    return path


# --- vehicles -----------------------------------------------------------------

GREEN = (0.27, 0.33, 0.18)
GREEN_DARK = (0.16, 0.2, 0.12)
RUBBER_C = (0.035, 0.035, 0.032)
STEEL_C = (0.62, 0.62, 0.58)
SOOT_C = (0.07, 0.07, 0.065)
LABEL_C = (0.86, 0.72, 0.28)
HAZE = (0.62, 0.66, 0.68)
RED = (0.45, 0.09, 0.06)
TAN = (0.55, 0.48, 0.34)
OLIVE_US = (0.29, 0.33, 0.22)


def add_wheel(kit, x, up, fwd, radius, width, tire, steel, segments=24):
    kit.cyl(f"tire_{x}_{fwd}", radius, width, (x, up, fwd), "x", tire, segments=segments)
    kit.cyl(
        f"hub_{x}_{fwd}",
        radius * 0.46,
        width * 1.08,
        (x, up, fwd),
        "x",
        steel,
        segments=max(12, segments // 2),
    )


def track_pose(t, fwd0, fwd1, radius):
    span = fwd1 - fwd0
    u = (t % 1.0) * 4
    if u < 1:
        fwd = fwd0 + u * span
        up = radius * 0.22
        pitch = 0.0
    elif u < 2:
        a = (u - 1) * math.pi
        fwd = fwd1 + math.sin(a) * radius * 0.92
        up = radius * 0.22 + (1 - math.cos(a)) * radius * 0.85
        pitch = a
    elif u < 3:
        fwd = fwd1 - (u - 2) * span
        up = radius * 0.22 + radius * 1.7
        pitch = math.pi
    else:
        a = (u - 3) * math.pi
        fwd = fwd0 - math.sin(a) * radius * 0.92
        up = radius * 0.22 + radius * 1.7 - (1 - math.cos(a)) * radius * 0.85
        pitch = math.pi + a
    return fwd, up, pitch


def add_track(kit, x, fwd0, fwd1, radius, width, rubber, steel):
    shoes = 52
    for i in range(shoes):
        fwd, up, pitch = track_pose(i / shoes, fwd0, fwd1, radius)
        kit.box(f"shoe_{x}_{i}", (width, 0.08, 0.18), (x, up, fwd), rubber, pitch=pitch)
        # Guide horn sits inboard, pitched with the shoe.
        horn_up = up + math.cos(pitch) * 0.07
        horn_fwd = fwd - math.sin(pitch) * 0.07
        kit.box(
            f"guide_{x}_{i}",
            (0.04, 0.07, 0.09),
            (x - math.copysign(width * 0.12, x), horn_up, horn_fwd),
            steel,
            pitch=pitch,
        )


def build_mbt(kit, paint, paint_dark, rubber, steel, soot, glass, lamp, label):
    # Hull tub. Meters, T-72 family public proportions (approx).
    kit.box("hull_lower", (2.05, 0.62, 6.15), (0, 0.78, 0.05), paint, bevel=0.02)
    kit.box("hull_upper", (1.92, 0.28, 3.4), (0, 1.18, -0.55), paint, bevel=0.015)
    # Glacis wedge: high at the rear of the plate, low at the nose.
    bm = bmesh.new()
    w, f0, f1 = 1.9, 1.15, 3.25
    z0, z1 = 1.28, 0.72
    verts = [
        (-w / 2, z0, f0),
        (w / 2, z0, f0),
        (w / 2, z1, f1),
        (-w / 2, z1, f1),
        (-w / 2, 0.5, f0),
        (w / 2, 0.5, f0),
        (w / 2, 0.5, f1),
        (-w / 2, 0.5, f1),
    ]
    for v in verts:
        bm.verts.new(P(*v))
    bm.verts.ensure_lookup_table()
    for face in (
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 3, 7, 4),
        (1, 5, 6, 2),
        (3, 2, 6, 7),
        (0, 4, 5, 1),
    ):
        bm.faces.new([bm.verts[i] for i in face])
    kit.from_bm("glacis", bm, paint, bevel=0.012)

    kit.box("rear_plate", (1.9, 0.7, 0.08), (0, 0.9, -3.05), paint_dark, bevel=0.01)
    for sign in (-1, 1):
        kit.box("fender", (0.38, 0.06, 5.6), (sign * 1.22, 1.12, 0.05), paint, bevel=0.006)
        # Skirts in two panels with a starboard gap for the believed point.
        if sign < 0:
            kit.box("skirt", (0.05, 0.48, 4.7), (sign * 1.55, 0.78, 0.1), paint_dark, bevel=0.006)
        else:
            kit.box("skirt_a", (0.05, 0.48, 2.15), (sign * 1.55, 0.78, 1.35), paint_dark, bevel=0.006)
            kit.box("skirt_b", (0.05, 0.48, 2.05), (sign * 1.55, 0.78, -1.25), paint_dark, bevel=0.006)
        add_wheel(kit, sign * 1.22, 0.4, 2.35, 0.3, 0.16, rubber, steel)  # idler
        add_wheel(kit, sign * 1.22, 0.42, -2.55, 0.36, 0.2, rubber, steel, segments=18)  # sprocket
        for i, fwd in enumerate((-1.85, -1.05, -0.25, 0.55, 1.3, 2.0)):
            add_wheel(kit, sign * 1.22, 0.4, fwd, 0.33, 0.18, rubber, steel)
        for fwd in (-1.4, 0.15, 1.45):
            add_wheel(kit, sign * 1.18, 1.02, fwd, 0.1, 0.08, rubber, steel, segments=14)
        add_track(kit, sign * 1.22, -2.55, 2.35, 0.36, 0.5, rubber, steel)
        # Sprocket teeth
        for k in range(10):
            a = 2 * math.pi * k / 10
            kit.box(
                f"tooth_{sign}_{k}",
                (0.08, 0.08, 0.12),
                (sign * 1.22, 0.42 + math.sin(a) * 0.4, -2.55 + math.cos(a) * 0.4),
                steel,
            )

    # Rear deck grilles
    kit.box("rear_deck", (1.55, 0.05, 1.15), (0, 1.34, -1.85), paint_dark, bevel=0.006)
    for i in range(7):
        kit.box(
            f"grille_{i}",
            (1.15, 0.03, 0.06),
            (0, 1.38, -2.25 + i * 0.14),
            soot,
        )

    # Turret — low cast oval, the T-72 family recognition feature.
    profile = [
        (0.15, 0.0),
        (0.95, 0.05),
        (1.05, 0.22),
        (0.98, 0.42),
        (0.72, 0.62),
        (0.28, 0.78),
    ]
    # Stretch forward by building then scaling mesh on blender Y.
    turret = kit.lathe("turret", "up", profile, (0, 1.28, 0.15), paint, segments=40)
    for v in turret.data.vertices:
        # semantic forward is -Y in blender; scale that axis about turret center.
        y = v.co.y
        center_y = -0.15
        v.co.y = center_y + (y - center_y) * 1.28
    turret.data.update()

    kit.cyl("cupola", 0.22, 0.12, (-0.28, 2.12, 0.05), "up", paint_dark, segments=16)
    kit.cyl("hatch", 0.18, 0.06, (0.32, 2.08, -0.15), "up", paint, segments=16)
    kit.box("mg", (0.04, 0.05, 0.55), (-0.28, 2.22, 0.45), steel)
    kit.cyl("antenna", 0.012, 0.85, (0.55, 2.35, -0.35), "up", steel, segments=8)

    for sign in (-1, 1):
        for k in range(4):
            kit.cyl(
                f"smoke_{sign}_{k}",
                0.035,
                0.16,
                (sign * 0.72, 1.85, 0.55 - k * 0.02),
                "fwd",
                steel,
                segments=8,
            )
    # ERA-like bricks — generic SAMPLE pattern, not a claimed armor map.
    for i in range(5):
        for j in range(2):
            kit.box(
                f"era_g_{i}_{j}",
                (0.28, 0.08, 0.16),
                (-0.7 + i * 0.34, 1.05 + j * 0.1, 2.15 - j * 0.22),
                paint_dark,
                bevel=0.004,
            )
    for sign in (-1, 1):
        for i in range(4):
            kit.box(
                f"era_t_{sign}_{i}",
                (0.16, 0.22, 0.28),
                (sign * 0.72, 1.7, 0.85 - i * 0.32),
                paint_dark,
                bevel=0.004,
            )

    kit.box("mantlet", (0.42, 0.36, 0.34), (0, 1.62, 1.15), paint_dark, bevel=0.01)
    kit.cyl("barrel", 0.075, 4.3, (0, 1.64, 3.35), "fwd", steel, segments=20)
    kit.cyl("evacuator", 0.11, 0.42, (0, 1.64, 2.55), "fwd", steel, segments=20)
    kit.cyl("muzzle", 0.095, 0.12, (0, 1.64, 5.5), "fwd", steel, segments=20)
    kit.box("driver_hatch", (0.42, 0.06, 0.36), (0, 1.12, 2.05), paint, bevel=0.004)
    kit.box("periscope", (0.16, 0.08, 0.08), (0, 1.18, 2.28), glass, kind="glass")

    for sign in (-1, 1):
        kit.cyl("drum", 0.22, 0.55, (sign * 0.48, 1.15, -3.35), "fwd", paint_dark, segments=18)
        kit.box("light", (0.1, 0.08, 0.06), (sign * 0.7, 0.95, 3.05), lamp, kind="lamp")
        kit.box("hook", (0.08, 0.08, 0.12), (sign * 0.7, 0.7, 3.2), steel)
    kit.cyl("log", 0.08, 1.7, (0, 1.15, -3.15), "x", flat_material("wood", (0.35, 0.24, 0.14), 0.8, 0.0))
    kit.box("exhaust", (0.28, 0.16, 0.42), (-1.05, 0.95, -2.3), soot, bevel=0.004)

    kit.label("SAMPLE", (0, 2.16, -0.55), 0.18, label)

    kit.anchor("rear-deck", 0.15, 1.42, -1.9)
    kit.anchor("turret-ring", -1.05, 1.4, 0.2)
    kit.anchor("driver-port", 0.0, 1.24, 2.28)
    kit.anchor("belly", 0.0, 0.42, 0.1)
    kit.anchor("skirt-gap", 1.62, 0.72, 0.15)


def airfoil_ring(chord, thick, n=7):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        y = thick * math.sin(math.pi * t) ** 0.85
        pts.append((t, y))
    for i in range(n - 2, 0, -1):
        t = i / (n - 1)
        y = -thick * 0.75 * math.sin(math.pi * t) ** 0.85
        pts.append((t, y))
    return pts


def add_wing(kit, name, side, root, span, root_chord, tip_chord, sweep, thick, up, mat, dihedral=0.08):
    foil_n = airfoil_ring(1, 1, 8)
    rings = []
    stations = 7
    for s in range(stations):
        t = s / (stations - 1)
        chord = root_chord * (1 - t) + tip_chord * t
        x = root[0] + side * (0.15 + t * span)
        fwd_le = root[2] - t * sweep
        z = root[1] + t * span * dihedral
        ring = []
        for u, w in foil_n:
            ring.append((x, z + w * thick * chord, fwd_le - u * chord))
        rings.append(ring)
    # Close the tip by scaling — loft caps the ends.
    kit.loft(name, rings, mat, cap=True)


def build_fighter(kit, paint, paint_dark, rubber, steel, soot, glass, lamp, label):
    # Twin-engine, twin-tail Fulcrum-family SAMPLE analog. ~17 m.
    stations = [
        (8.4, 0.05, 0.05, 0.0),
        (7.4, 0.28, 0.26, 0.02),
        (6.2, 0.48, 0.46, 0.08),
        (5.0, 0.72, 0.62, 0.12),
        (3.6, 0.95, 0.62, 0.08),
        (2.0, 1.05, 0.58, 0.02),
        (0.4, 0.95, 0.55, 0.0),
        (-1.2, 0.85, 0.52, 0.0),
        (-3.0, 0.78, 0.5, 0.0),
        (-5.0, 0.62, 0.46, 0.0),
        (-6.6, 0.42, 0.38, 0.02),
    ]
    rings = []
    segs = 28
    for fwd, rx, ry, up in stations:
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            ring.append((math.cos(a) * rx, up + math.sin(a) * ry, fwd))
        rings.append(ring)
    kit.loft("fuselage", rings, paint, cap=True)

    # LERX
    for sign in (-1, 1):
        bm = bmesh.new()
        pts = [
            (sign * 0.2, 0.15, 6.4),
            (sign * 0.85, 0.05, 2.4),
            (sign * 0.35, 0.02, 2.2),
            (sign * 0.15, 0.12, 6.2),
        ]
        for p in pts:
            bm.verts.new(P(*p))
        bm.verts.ensure_lookup_table()
        try:
            bm.faces.new(list(bm.verts))
        except ValueError:
            pass
        # give the LERX thickness
        geom = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        bmesh.ops.translate(bm, verts=[v for v in geom["geom"] if isinstance(v, bmesh.types.BMVert)], vec=(0, 0, 0.06))
        kit.from_bm(f"lerx_{sign}", bm, paint_dark, bevel=0.0)

    add_wing(kit, "wing_stbd", 1, (0.7, 0.05, 1.6), 4.6, 3.3, 1.15, 2.4, 0.11, 0.05, paint, 0.04)
    add_wing(kit, "wing_port", -1, (-0.7, 0.05, 1.6), 4.6, 3.3, 1.15, 2.4, 0.11, 0.05, paint, 0.04)
    add_wing(kit, "stab_stbd", 1, (0.35, 0.15, -5.6), 2.1, 1.5, 0.7, 0.9, 0.08, 0.15, paint_dark, 0.02)
    add_wing(kit, "stab_port", -1, (-0.35, 0.15, -5.6), 2.1, 1.5, 0.7, 0.9, 0.08, 0.15, paint_dark, 0.02)

    for sign in (-1, 1):
        # Canted twin tails
        bm = bmesh.new()
        res = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, verts=res["verts"], vec=(0.08, 1.5, 1.7))
        bmesh.ops.translate(bm, verts=res["verts"], vec=P(sign * 0.85, 1.15, -5.5))
        kit.from_bm(f"tail_{sign}", bm, paint, bevel=0.01)
        # Intake
        kit.box(f"intake_{sign}", (0.42, 0.55, 1.5), (sign * 0.72, -0.15, 2.6), soot, bevel=0.02)
        kit.box(f"duct_{sign}", (0.36, 0.22, 2.4), (sign * 0.78, -0.28, 0.6), paint_dark, bevel=0.015)
        # Nozzle
        kit.cyl(f"nozzle_{sign}", 0.28, 0.7, (sign * 0.55, 0.05, -7.15), "fwd", steel, segments=24, radius2=0.34)
        kit.cyl(f"hot_{sign}", 0.18, 0.12, (sign * 0.55, 0.05, -7.52), "fwd", soot, segments=16)
        # Wing missile
        kit.cyl(f"store_{sign}", 0.07, 1.5, (sign * 2.4, -0.15, 0.4), "fwd", paint_dark, segments=12)
        kit.lathe(
            f"store_nose_{sign}",
            "fwd",
            [(0.07, 0.0), (0.05, 0.15), (0.0, 0.32)],
            (sign * 2.4, -0.15, 1.15),
            paint_dark,
            segments=12,
        )

    # Canopy
    kit.lathe(
        "canopy",
        "up",
        [(0.05, 0.0), (0.32, 0.02), (0.38, 0.18), (0.22, 0.38), (0.05, 0.48)],
        (0, 0.72, 4.3),
        glass,
        segments=24,
        kind="glass",
    )
    kit.box("seat", (0.28, 0.28, 0.35), (0, 0.55, 4.15), soot)
    kit.cyl("pitot", 0.015, 0.7, (0, 0.05, 8.7), "fwd", steel, segments=8)

    # Gear down — undercarriage view
    kit.cyl("nose_strut", 0.04, 0.7, (0, -0.35, 5.4), "up", steel, segments=10)
    kit.cyl("nose_wheel", 0.14, 0.08, (0, -0.72, 5.4), "x", rubber, segments=16)
    for sign in (-1, 1):
        kit.cyl(f"main_strut_{sign}", 0.05, 0.62, (sign * 0.55, -0.32, 0.2), "up", steel, segments=10)
        kit.cyl(f"main_wheel_{sign}", 0.2, 0.12, (sign * 0.55, -0.7, 0.2), "x", rubber, segments=16)
    kit.box("gear_door", (0.7, 0.02, 0.9), (0, -0.48, 0.35), paint_dark)

    kit.label("SAMPLE", (0, 0.7, 1.2), 0.22, label)
    kit.anchor("nozzles", 0.0, 0.05, -7.55)
    kit.anchor("canopy", 0.0, 1.15, 4.35)
    kit.anchor("wing-root", 1.15, 0.12, 1.3)
    kit.anchor("gear-bay", 0.0, -0.5, 0.3)


def ship_rings(length, beam, draft, deck):
    rings = []
    stations = 22
    around = 18
    for s in range(stations):
        t = s / (stations - 1)
        fwd = -length / 2 + t * length
        bow = max(0.0, (t - 0.78) / 0.22)
        stern = max(0.0, (0.08 - t) / 0.08)
        half = (beam / 2) * (0.72 + 0.28 * math.sin(math.pi * min(t, 1) ) ** 0.65)
        half *= 1 - bow ** 1.35
        half *= 1 - 0.35 * stern
        deck_h = deck * (1.0 + 0.28 * max(0.0, (t - 0.62) / 0.38))
        keel = -draft * (1 - 0.35 * bow)
        ring = []
        for i in range(around):
            a = 2 * math.pi * i / around
            # a=0 at +up? Use sin/cos so bottom is keel and top is deck.
            # Shape: x = sin * half, up blends keel..deck
            ca = math.cos(a)
            sa = math.sin(a)
            up = (keel + deck_h) / 2 + ca * (deck_h - keel) / 2
            # Fuller near the waterline
            flare = 1.0 if ca > -0.2 else 0.72 + 0.28 * (ca + 1)
            x = sa * half * flare
            if up > deck_h:
                up = deck_h
            if up < keel:
                up = keel
            ring.append((x, up, fwd))
        rings.append(ring)
    return rings


def build_vessel(kit, haze, red, rubber, steel, soot, glass, lamp, label):
    length, beam, draft, deck = 86.0, 12.2, 3.4, 4.2
    rings = ship_rings(length, beam, draft, deck)
    hull = kit.loft("hull", rings, haze, cap=True)
    # Split red bottom vs gray topsides by face height.
    hull.data.materials.clear()
    hull.data.materials.append(red)
    hull.data.materials.append(haze)
    for poly in hull.data.polygons:
        zs = [hull.data.vertices[i].co.z for i in poly.vertices]
        poly.material_index = 0 if (sum(zs) / len(zs)) < 0.15 else 1
    kit.box("boot", (beam * 0.98, 0.18, length * 0.86), (0, 0.05, 0), flat_material("boot", (0.04, 0.04, 0.045), 0.55, 0.1))

    # Bow gun
    kit.cyl("gun_mount", 1.1, 0.7, (0, deck + 0.7, 30), "up", haze, segments=20)
    kit.cyl("gun", 0.16, 4.2, (0, deck + 1.15, 33.2), "fwd", steel, segments=16)
    # Breakwater
    kit.box("breakwater", (6.5, 0.9, 0.12), (0, deck + 0.5, 24), haze, bevel=0.04)
    # Bridge
    kit.box("bridge", (7.2, 2.6, 8.5), (0, deck + 1.6, 12), haze, bevel=0.08)
    kit.box("bridge_top", (5.5, 1.3, 5.5), (0, deck + 3.4, 12.4), haze, bevel=0.05)
    for i in range(6):
        kit.box(
            f"window_{i}",
            (0.7, 0.55, 0.08),
            (-2.2 + i * 0.9, deck + 2.15, 16.3),
            glass,
            kind="glass",
        )
    # Mast and radar
    kit.cyl("mast", 0.18, 7.5, (0, deck + 6.2, 8), "up", haze, segments=10)
    kit.cyl("radar", 1.3, 0.18, (0, deck + 8.6, 8), "up", steel, segments=20)
    kit.box("yard", (3.2, 0.08, 0.08), (0, deck + 7.4, 8), steel)
    # Funnel
    kit.box("funnel", (2.2, 3.2, 3.0), (0, deck + 2.2, -2), haze, bevel=0.05)
    kit.box("uptake", (1.3, 0.15, 1.6), (0, deck + 3.85, -2), soot)
    # Hangar and flight deck
    kit.box("hangar", (8.0, 3.0, 12), (0, deck + 1.7, -18), haze, bevel=0.06)
    kit.cyl("pad", 4.2, 0.06, (0, deck + 0.2, -32), "up", flat_material("pad", (0.55, 0.57, 0.58), 0.6, 0.05), segments=28)
    kit.cyl("pad_ring", 3.3, 0.08, (0, deck + 0.28, -32), "up", label, segments=28)
    # RHIB
    kit.box("rhib", (1.2, 0.7, 4.2), (5.2, deck + 1.3, -6), haze, bevel=0.05)
    # Rail posts
    for fwd in range(-36, 34, 4):
        for sign in (-1, 1):
            x = sign * (beam * 0.36)
            kit.cyl(f"post_{sign}_{fwd}", 0.05, 1.1, (x, deck + 0.7, fwd), "up", steel, segments=6)
    # Props, shafts, rudder — undercarriage
    for sign in (-1, 1):
        kit.cyl(f"shaft_{sign}", 0.18, 8, (sign * 1.6, -draft + 0.6, -38), "fwd", steel, segments=12)
        kit.cyl(f"hub_{sign}", 0.35, 0.4, (sign * 1.6, -draft + 0.6, -42.2), "fwd", steel, segments=14)
        for b in range(4):
            ang = b * math.pi / 2
            kit.box(
                f"blade_{sign}_{b}",
                (0.12, 0.9, 0.35),
                (sign * 1.6 + math.cos(ang) * 0.15, -draft + 0.6 + math.sin(ang) * 0.7, -42.5),
                steel,
            )
    kit.box("rudder", (0.12, 2.2, 1.1), (0, -draft + 1.2, -40), red, bevel=0.02)
    kit.box("keel_bar", (0.16, 0.2, length * 0.7), (0, -draft - 0.05, -2), red)
    # Magazine plate, starboard aft below waterline
    kit.box("mag_hatch", (0.08, 1.4, 2.2), (beam * 0.28, -1.3, -16), red, bevel=0.02)
    kit.label("SAMPLE", (0, deck + 3.1, -18), 0.9, label)

    kit.anchor("bridge", 0.2, deck + 2.15, 16.35)
    kit.anchor("funnel", 0.0, deck + 3.95, -2)
    kit.anchor("keel", 0.0, -draft - 0.1, -2)
    kit.anchor("magazine", beam * 0.32, -1.3, -16)


def add_missile(kit, tail, elev_deg, length, radius, body, nose_mat, steel, soot, segments=28):
    """Missile along +forward, then elevated (nose up) about the tail."""
    elev = math.radians(elev_deg)
    parts = []
    body_obj = kit.cyl("round", radius, length * 0.78, (tail[0], tail[1], tail[2] + length * 0.39), "fwd", body, segments=segments)
    parts.append(body_obj)
    nose = kit.lathe(
        "nose",
        "fwd",
        [(radius, 0), (radius * 0.72, length * 0.08), (radius * 0.28, length * 0.16), (0.0, length * 0.22)],
        (tail[0], tail[1], tail[2] + length * 0.78),
        nose_mat,
        segments=segments,
    )
    parts.append(nose)
    nozzle = kit.cyl(
        "nozzle",
        radius * 0.55,
        length * 0.08,
        (tail[0], tail[1], tail[2] - length * 0.02),
        "fwd",
        soot,
        segments=segments,
        radius2=radius * 0.75,
    )
    parts.append(nozzle)
    fin = radius * 0.95
    for axis, offset in (("x", fin), ("up", fin)):
        for sign in (-1, 1):
            if axis == "x":
                center = (tail[0] + sign * (radius + fin * 0.35), tail[1], tail[2] + length * 0.08)
                size = (fin, 0.025, fin * 0.7)
            else:
                center = (tail[0], tail[1] + sign * (radius + fin * 0.35), tail[2] + length * 0.08)
                size = (0.025, fin, fin * 0.7)
            parts.append(kit.box("fin", size, center, steel))
    # Bands
    parts.append(
        kit.cyl(
            "band",
            radius * 1.01,
            length * 0.04,
            (tail[0], tail[1], tail[2] + length * 0.5),
            "fwd",
            flat_material("band", LABEL_C, 0.45, 0.05),
            segments=segments,
        )
    )
    kit.elevate(parts, tail, elev)
    # Anchors in the same rotation.
    def point(dist, rx=0.0, ru=0.0):
        ang = -elev
        y = -dist
        z = ru
        x = rx
        c, s = math.cos(ang), math.sin(ang)
        y2 = y * c - z * s
        z2 = y * s + z * c
        origin = P(*tail)
        return (origin.x + x, origin.z + z2, -(origin.y + y2))

    # point() returns semantic (x, up, fwd) because P inverse: x=bx, up=bz, fwd=-by
    nose_p = point(length * 0.98)
    tail_p = point(-length * 0.02)
    joint_p = point(length * 0.55, 0, radius * 1.15)
    fin_p = point(length * 0.1, radius + fin * 0.45, 0)
    return nose_p, tail_p, joint_p, fin_p


def wheel_row(kit, xs_fwd, x, radius, rubber, steel, up):
    for fwd in xs_fwd:
        add_wheel(kit, x, up, fwd, radius, radius * 0.55, rubber, steel, segments=18)


def build_tochka(kit, paint, rubber, steel, soot, glass, lamp, label):
    # Boat-hulled 6x6 TEL analog, missile elevated.
    kit.box("hull", (2.5, 1.15, 9.4), (0, 1.15, 0), paint, bevel=0.03)
    # Pointed nose
    bm = bmesh.new()
    verts = [
        (-1.25, 1.7, 3.6),
        (1.25, 1.7, 3.6),
        (1.25, 0.6, 3.6),
        (-1.25, 0.6, 3.6),
        (0, 1.35, 5.3),
        (0, 0.7, 5.3),
    ]
    for v in verts:
        bm.verts.new(P(*v))
    bm.verts.ensure_lookup_table()
    for face in ((0, 1, 4), (2, 5, 1), (3, 5, 2), (0, 4, 5), (0, 5, 3), (1, 2, 5), (4, 1, 5) if False else (0, 1, 4)):
        pass
    faces = [(0, 1, 4), (1, 2, 5), (1, 5, 4), (2, 3, 5), (3, 0, 4), (3, 4, 5), (0, 3, 2, 1)]
    for face in faces:
        try:
            bm.faces.new([bm.verts[i] for i in face])
        except ValueError:
            pass
    kit.from_bm("bow", bm, paint, bevel=0.02)
    kit.box("cab", (2.2, 1.15, 2.4), (0, 2.2, 2.3), paint, bevel=0.02)
    for i in range(3):
        kit.box(f"cab_glass_{i}", (0.45, 0.38, 0.05), (-0.55 + i * 0.55, 2.35, 3.52), glass, kind="glass")
    for sign in (-1, 1):
        wheel_row(kit, (-3.1, -0.6, 2.4), sign * 1.25, 0.48, rubber, steel, 0.48)
    kit.box("rail", (0.7, 0.12, 6.2), (0, 1.85, -0.4), steel)
    nose, tail, joint, fin = add_missile(
        kit, (0.0, 2.05, -1.6), 52, 6.4, 0.32, paint, steel, steel, soot
    )
    kit.label("SAMPLE", (0, 2.85, 2.2), 0.28, label)
    for anchor_id, pt in (("seeker", nose), ("nozzle", tail), ("joint", joint), ("fin-root", fin)):
        kit.anchor(anchor_id, *pt)


def build_iskander(kit, paint, rubber, steel, soot, glass, lamp, label):
    # 8x8 TEL, twin pack, one round exposed.
    kit.box("frame", (2.7, 0.42, 12.2), (0, 1.22, 0), paint, bevel=0.02)
    kit.box("cab", (2.55, 1.7, 2.8), (0, 1.85, 4.6), paint, bevel=0.03)
    kit.box("hood", (2.2, 0.7, 1.6), (0, 1.45, 6.5), paint, bevel=0.02)
    for i in range(2):
        kit.box(f"wind_{i}", (0.7, 0.55, 0.06), (-0.45 + i * 0.9, 2.15, 6.02), glass, kind="glass")
    for sign in (-1, 1):
        wheel_row(kit, (-4.5, -2.9, 0.4, 2.0), sign * 1.35, 0.55, rubber, steel, 0.55)
        kit.box(f"tank_{sign}", (0.45, 0.7, 1.8), (sign * 1.15, 1.45, 2.2), paint)
    # Closed canister + open round
    kit.box("canister", (0.7, 0.7, 7.2), (-0.55, 2.15, -1.2), paint, bevel=0.02)
    nose, tail, joint, fin = add_missile(
        kit, (0.6, 1.85, -4.4), 48, 7.3, 0.42, paint, steel, steel, soot, segments=32
    )
    kit.label("SAMPLE", (0, 2.8, 4.5), 0.32, label)
    for anchor_id, pt in (("seeker", nose), ("nozzle", tail), ("joint", joint), ("fin-root", fin)):
        kit.anchor(anchor_id, *pt)


def build_m270(kit, paint, rubber, steel, soot, glass, lamp, label):
    # Tracked MLRS-class SAMPLE analog with a longer later-block round.
    kit.box("hull", (3.0, 1.35, 6.6), (0, 1.15, 0), paint, bevel=0.03)
    kit.box("cab", (2.5, 1.15, 1.8), (0, 2.15, 2.15), paint, bevel=0.02)
    for i in range(3):
        kit.box(f"glass_{i}", (0.45, 0.4, 0.06), (-0.6 + i * 0.55, 2.25, 3.08), glass, kind="glass")
    for sign in (-1, 1):
        add_track(kit, sign * 1.45, -2.7, 2.7, 0.42, 0.55, rubber, steel)
        add_wheel(kit, sign * 1.45, 0.48, 2.55, 0.32, 0.18, rubber, steel)
        add_wheel(kit, sign * 1.45, 0.5, -2.55, 0.38, 0.22, rubber, steel)
        for fwd in (-1.7, -0.7, 0.3, 1.3):
            add_wheel(kit, sign * 1.45, 0.48, fwd, 0.34, 0.2, rubber, steel)
    kit.box("pod", (1.55, 1.05, 4.0), (0, 2.15, -0.7), paint, bevel=0.02)
    nose, tail, joint, fin = add_missile(
        kit,
        (0.35, 2.05, 1.2),
        42,
        4.7,
        0.3,
        flat_material("later", (0.78, 0.78, 0.74), 0.4, 0.3, coat=0.15),
        steel,
        steel,
        soot,
    )
    kit.label("SAMPLE", (0, 2.8, 2.0), 0.22, label)
    for anchor_id, pt in (("seeker", nose), ("nozzle", tail), ("joint", joint), ("fin-root", fin)):
        kit.anchor(anchor_id, *pt)


def build_himars(kit, paint, rubber, steel, soot, glass, lamp, label):
    # Wheeled HIMARS-class SAMPLE analog with a short Block I round.
    kit.box("chassis", (2.45, 0.45, 7.2), (0, 0.95, 0), paint, bevel=0.02)
    kit.box("cab", (2.35, 1.6, 2.3), (0, 1.75, 2.3), paint, bevel=0.025)
    kit.box("wind", (2.0, 0.7, 0.06), (0, 2.05, 3.48), glass, kind="glass")
    for sign in (-1, 1):
        wheel_row(kit, (-2.5, -0.9, 1.6), sign * 1.2, 0.5, rubber, steel, 0.5)
    kit.box("pod", (1.35, 0.95, 4.3), (0, 1.85, -1.3), paint, bevel=0.02)
    nose, tail, joint, fin = add_missile(
        kit,
        (0.0, 2.15, -0.2),
        18,
        4.0,
        0.28,
        flat_material("atk", (0.72, 0.73, 0.7), 0.42, 0.25),
        steel,
        steel,
        soot,
    )
    kit.label("SAMPLE", (0, 2.65, 2.2), 0.24, label)
    for anchor_id, pt in (("seeker", nose), ("nozzle", tail), ("joint", joint), ("fin-root", fin)):
        kit.anchor(anchor_id, *pt)


def tel_mats():
    paint, _dark, rubber, steel, soot, glass, lamp, label = mats()
    return paint, rubber, steel, soot, glass, lamp, label


def mats():
    paint = paint_material("paint", GREEN, 0.5, 0.04, dirt=0.45, coat=0.22)
    paint_dark = paint_material("paint_dark", GREEN_DARK, 0.55, 0.06, dirt=0.35, coat=0.12)
    rubber = flat_material("rubber", RUBBER_C, 0.92, 0.0)
    steel = flat_material("steel", STEEL_C, 0.32, 0.92, coat=0.05)
    soot = flat_material("soot", SOOT_C, 0.72, 0.35)
    glass = glass_material("glass")
    lamp = lamp_material("lamp")
    label = flat_material("label", LABEL_C, 0.42, 0.08, coat=0.3)
    return paint, paint_dark, rubber, steel, soot, glass, lamp, label


def run_one(model_id, builder, focus, cam):
    print(f"BUILD {model_id}")
    reset_scene()
    kit = Kit()
    builder(kit)
    finish(model_id, kit, focus, cam)


def main():
    jobs = {
        "sphere-mbt": (lambda k: build_mbt(k, *mats()), (0, 1.2, 0.4), (5.5, 3.2, 8.5)),
        "sphere-fighter": (lambda k: build_fighter(k, *mats()), (0, 0.4, 0.5), (10, 4.5, 14)),
        "sphere-vessel": (
            lambda k: build_vessel(
                k,
                paint_material("haze", HAZE, 0.46, 0.08, dirt=0.28, coat=0.18),
                paint_material("red", RED, 0.6, 0.04, dirt=0.2, coat=0.05),
                flat_material("rubber", RUBBER_C, 0.9, 0),
                flat_material("steel", STEEL_C, 0.34, 0.9),
                flat_material("soot", SOOT_C, 0.7, 0.4),
                glass_material("glass"),
                lamp_material("lamp"),
                flat_material("label", LABEL_C, 0.4, 0.05, coat=0.2),
            ),
            (0, 2, 0),
            (40, 22, 70),
        ),
        "sphere-tochka-u": (lambda k: build_tochka(k, *tel_mats()), (0, 2.2, 0.5), (8, 5, 10)),
        "sphere-iskander-m": (lambda k: build_iskander(k, *tel_mats()), (0, 2, 0), (10, 6, 12)),
        "sphere-atacms-block-i": (
            lambda k: build_himars(
                k,
                paint_material("tan", TAN, 0.52, 0.05, dirt=0.3, coat=0.18),
                *mats()[2:],
            ),
            (0, 1.6, 0.4),
            (7, 4.2, 9),
        ),
        "sphere-atacms-later-block": (
            lambda k: build_m270(
                k,
                paint_material("us", OLIVE_US, 0.5, 0.05, dirt=0.35, coat=0.16),
                *mats()[2:],
            ),
            (0, 1.4, 0),
            (7, 4, 9),
        ),
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    for model_id, (builder, focus, cam) in jobs.items():
        if ONLY and ONLY not in model_id:
            continue
        run_one(model_id, builder, focus, cam)


if __name__ == "__main__":
    main()
