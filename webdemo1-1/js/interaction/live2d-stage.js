// 最小 Live2D 渲染：Cubism Core 计算顶点，这里只负责 WebGL 绘制、遮罩和待机/口型参数。
// 依赖页面先加载 js/vendor/live2dcubismcore.min.js（Live2D Proprietary Software License）。
const VERTEX = `attribute vec2 a_position;attribute vec2 a_uv;uniform vec4 u_view;varying vec2 v_uv;
void main(){gl_Position=vec4(a_position*u_view.xy+u_view.zw,0.,1.);v_uv=vec2(a_uv.x,1.-a_uv.y);}`;
const FRAGMENT = `precision mediump float;varying vec2 v_uv;uniform sampler2D u_texture;uniform float u_opacity;uniform float u_mask;
void main(){vec4 color=texture2D(u_texture,v_uv);if(u_mask>.5){if(color.a<.5)discard;gl_FragColor=vec4(0.);return;}gl_FragColor=color*u_opacity;}`;

async function fetchOk(url, type) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法加载 ${url}（HTTP ${response.status}）`);
  return type === 'json' ? response.json() : response.arrayBuffer();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载贴图 ${url}`));
    image.src = url;
  });
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export async function createLive2DStage({ canvas, modelUrl, getMouthLevel = () => 0, framing = { zoom: 1.9, focusY: 0.28 } }) {
  const Core = window.Live2DCubismCore;
  if (!Core) throw new Error('Live2D 运行库未加载。');
  const gl = canvas.getContext('webgl', { alpha: true, stencil: true, premultipliedAlpha: true, antialias: true });
  if (!gl) throw new Error('当前浏览器不支持 WebGL，无法显示数字人。');

  const base = new URL('.', new URL(modelUrl, location.href)).href;
  const setting = await fetchOk(modelUrl, 'json');
  const refs = setting.FileReferences;
  const [mocBuffer, pose, images] = await Promise.all([
    fetchOk(base + refs.Moc),
    refs.Pose ? fetchOk(base + refs.Pose, 'json') : null,
    Promise.all(refs.Textures.map(path => loadImage(base + path))),
  ]);
  const moc = Core.Moc.fromArrayBuffer(mocBuffer);
  if (!moc) throw new Error('人物模型文件无法解析。');
  const model = Core.Model.fromMoc(moc);
  const { drawables, parameters, parts } = model;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const loc = {
    position: gl.getAttribLocation(program, 'a_position'), uv: gl.getAttribLocation(program, 'a_uv'),
    view: gl.getUniformLocation(program, 'u_view'), opacity: gl.getUniformLocation(program, 'u_opacity'),
    mask: gl.getUniformLocation(program, 'u_mask'), texture: gl.getUniformLocation(program, 'u_texture'),
  };
  gl.uniform1i(loc.texture, 0);
  const positionBuffer = gl.createBuffer(), uvBuffer = gl.createBuffer(), indexBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(loc.position);
  gl.enableVertexAttribArray(loc.uv);

  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const textures = images.map(image => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  });

  const paramIndex = new Map(parameters.ids.map((id, index) => [id, index]));
  const setParam = (id, value) => {
    const index = paramIndex.get(id);
    if (index === undefined) return;
    parameters.values[index] = Math.min(parameters.maximumValues[index], Math.max(parameters.minimumValues[index], value));
  };
  const groupIds = name => setting.Groups?.find(group => group.Name === name)?.Ids || [];
  const lipIds = groupIds('LipSync').length ? groupIds('LipSync') : ['ParamMouthOpenY'];
  const blinkIds = groupIds('EyeBlink');
  // pose3：同组部件只显示第一套（如两套手臂），否则会重叠。
  const partIndex = new Map(parts.ids.map((id, index) => [id, index]));
  const hiddenParts = (pose?.Groups || []).flatMap(group => group.slice(1).map(item => partIndex.get(item.Id)))
    .filter(index => index !== undefined);

  const flags = Core.Utils;
  const draw = (index, asMask) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawables.vertexPositions[index], gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawables.vertexUvs[index], gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawables.indices[index], gl.DYNAMIC_DRAW);
    gl.bindTexture(gl.TEXTURE_2D, textures[drawables.textureIndices[index]]);
    gl.uniform1f(loc.mask, asMask ? 1 : 0);
    gl.uniform1f(loc.opacity, drawables.opacities[index]);
    gl.drawElements(gl.TRIANGLES, drawables.indexCounts[index], gl.UNSIGNED_SHORT, 0);
  };

  // 取景：zoom 为相对模型画布高度的放大倍数，focusY 为视图中心相对画布中心上移的比例。
  // 顶点单位换算：像素 = 原点 + 单位 × PixelsPerUnit（y 向上）。
  const info = model.canvasinfo;
  const unitHeight = info.CanvasHeight / info.PixelsPerUnit;
  const canvasCenterX = (info.CanvasWidth / 2 - info.CanvasOriginX) / info.PixelsPerUnit;
  const canvasCenterY = (info.CanvasOriginY - info.CanvasHeight / 2) / info.PixelsPerUnit;
  const viewTransform = () => {
    const aspect = canvas.width / canvas.height;
    const sy = (2 / unitHeight) * framing.zoom;
    const sx = sy / aspect;
    const centerY = canvasCenterY + unitHeight * framing.focusY;
    return [sx, sy, -canvasCenterX * sx, -centerY * sy];
  };

  let frame = 0, disposed = false, mouth = 0, nextBlink = 1.5, blinkStart = -1;
  const start = performance.now();
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio), height = Math.round(canvas.clientHeight * ratio);
    if (width && height && (canvas.width !== width || canvas.height !== height)) { canvas.width = width; canvas.height = height; }
  };
  const tick = now => {
    if (disposed) return;
    resize();
    const t = (now - start) / 1000;
    setParam('ParamBreath', (Math.sin(t * 1.6) + 1) / 2);
    setParam('ParamAngleX', Math.sin(t * 0.55) * 6);
    setParam('ParamAngleY', Math.sin(t * 0.37) * 3);
    setParam('ParamBodyAngleX', Math.sin(t * 0.45) * 2.5);
    setParam('ParamBodyX', Math.sin(t * 0.45) * 2.5); // 由 Cubism 2 转换的模型（如 Shizuku）使用此 ID
    if (blinkStart < 0 && t > nextBlink) blinkStart = t;
    const blinkPhase = blinkStart < 0 ? 1 : Math.abs(1 - (t - blinkStart) / 0.09);
    if (blinkStart >= 0 && t - blinkStart > 0.18) { blinkStart = -1; nextBlink = t + 2 + Math.random() * 3; }
    blinkIds.forEach(id => setParam(id, Math.min(1, blinkPhase)));
    const target = Math.min(1, Math.max(0, getMouthLevel()));
    mouth += (target - mouth) * (target > mouth ? 0.55 : 0.25);
    lipIds.forEach(id => setParam(id, mouth));
    hiddenParts.forEach(index => { parts.opacities[index] = 0; });
    model.update();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.uniform4fv(loc.view, viewTransform());
    const orders = typeof model.getRenderOrders === 'function' ? model.getRenderOrders() : drawables.renderOrders;
    const sorted = Array.from({ length: drawables.count }, (_, index) => index).sort((a, b) => orders[a] - orders[b]);
    for (const index of sorted) {
      if (!flags.hasIsVisibleBit(drawables.dynamicFlags[index]) || drawables.opacities[index] <= 0.001) continue;
      const constant = drawables.constantFlags[index];
      if (flags.hasIsDoubleSidedBit(constant)) gl.disable(gl.CULL_FACE);
      else { gl.enable(gl.CULL_FACE); gl.frontFace(gl.CCW); }
      const maskCount = drawables.maskCounts[index];
      if (maskCount > 0) {
        // 遮罩用模板缓冲近似：遮罩贴图 alpha ≥ 0.5 的区域可见。
        gl.enable(gl.STENCIL_TEST);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.colorMask(false, false, false, false);
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.disable(gl.CULL_FACE);
        for (let m = 0; m < maskCount; m++) draw(drawables.masks[index][m], true);
        gl.colorMask(true, true, true, true);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.stencilFunc(flags.hasIsInvertedMaskBit(constant) ? gl.NOTEQUAL : gl.EQUAL, 1, 0xff);
        if (!flags.hasIsDoubleSidedBit(constant)) gl.enable(gl.CULL_FACE);
      } else gl.disable(gl.STENCIL_TEST);
      if (flags.hasBlendAdditiveBit(constant)) gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      else if (flags.hasBlendMultiplicativeBit(constant)) gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      else gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      draw(index, false);
    }
    gl.disable(gl.STENCIL_TEST);
    drawables.resetDynamicFlags();
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      model.release();
      moc._release?.();
    },
  };
}
