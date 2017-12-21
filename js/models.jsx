PP64.models = (function() {
  const ModelViewer = class ModelViewer extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        selectedModel: "",
        selectedModelDir: null,
        selectedModelFile: null,
        bgColor: 0x000000,
      };

      // Set first model, start at dir 2 so it's Mario.
      let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
      for (let d = 2; d < mainfsDirCount; d++) {
        let dirFileCount = PP64.fs.mainfs.getFileCount(d);
        for (let f = 0; f < dirFileCount; f++) {
          let file = PP64.fs.mainfs.get(d, f);
          if (PP64.utils.FORM.isForm(file)) {
            const name = d + "/" + f;
            this.state.selectedModel = name;
            this.state.selectedModelDir = d;
            this.state.selectedModelFile = f;
            return;
          }
        }
      }
    }

    render() {
      return (
        <div className="modelViewerContainer">
          <ModelToolbar
            selectedModel={this.state.selectedModel}
            onModelSelected={this.onModelSelected}
            selectedModelDir={this.state.selectedModelDir}
            selectedModelFile={this.state.selectedModelFile}
            bgColor={this.state.bgColor}
            onBgColorChange={this.onBgColorChange} />
          <ModelRenderer
            selectedModelDir={this.state.selectedModelDir}
            selectedModelFile={this.state.selectedModelFile}
            bgColor={this.state.bgColor} />
        </div>
      );
    }

    onModelSelected = (model) => {
      const pieces = model.match(/^(\d+)\/(\d+)/);
      if (!pieces)
        throw `Could not parse selected model string ${this.props.selectedModel}`;

      const [, dir, file] = pieces;

      this.setState({
        selectedModel: model,
        selectedModelDir: dir,
        selectedModelFile: file,
      });
    }

    onBgColorChange = (color) => {
      this.setState({
        bgColor: color,
      });
    }
  };

  let _modelRenderer, camera, scene, renderer, controls, animateTimer;
  const ModelRenderer = class ModelRenderer extends React.Component {
    state = {
      hasError: false
    }

    render() {
      if (this.state.hasError) {
        return (
          <p>An error occurred during rendering, see the browser console.</p>
        );
      }

      return (
        <div className="modelRenderContainer"></div>
      );
    }

    componentDidCatch(error, info) {
      this.setState({ hasError: true });
      console.error(error, info);
    }

    componentDidMount() {
      try {
        _modelRenderer = this;
        this.initModel();
      }
      catch (e) {
        console.error(e);
      }
    }

    componentWillUnmount() {
      try {
        _modelRenderer = null;
        this.clearViewer();
      }
      catch (e) {
        console.error(e);
      }
    }

    componentDidUpdate() {
      try {
        this.clearViewer();
        this.initModel();
      }
      catch (e) {
        console.error(e);
      }
    }

    clearViewer() {
      if (!renderer)
        return;
      let container = ReactDOM.findDOMNode(this);
      if (renderer.domElement.offsetParent)
        container.removeChild(renderer.domElement);
      if (animateTimer) {
        clearTimeout(animateTimer);
        animateTimer = null;
      }
    }

    initModel() {
      if (this.props.selectedModelDir === null) {
        return;
      }

      const [dir, file] = [this.props.selectedModelDir, this.props.selectedModelFile];

      const container = ReactDOM.findDOMNode(this);
      const height = container.offsetHeight;
      const width = container.offsetWidth;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(this.props.bgColor);

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 999999);
      camera.position.z = 500;

      $$log(`Rendering model ${dir}/${file}`);

      const form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      $$log("form", form);

      const modelObj = (new FormToThreeJs()).createModel(form);
      scene.add(modelObj);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);

      container.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);

      this.animate();
    }

    renderModel() {
      renderer.render(scene, camera);
    }

    animate() {
      if (!_modelRenderer)
        return;
			controls.update();
			_modelRenderer.renderModel();
      animateTimer = setTimeout(_modelRenderer.animate, 100);
		}
  };

  const ModelToolbar = class ModelToolbar extends React.Component {
    state = {}

    render() {
      return (
        <div className="modelViewerToolbar">
          <ModelSelect
            selectedModel={this.props.selectedModel}
            onModelSelected={this.props.onModelSelected} />
          <ModelBGColorSelect
            selectedColor={this.props.bgColor}
            onColorChange={this.props.onBgColorChange} />
          {/* <div className="modelViewerToolbarSpacer" />
          <ModelExportObjButton
            selectedModelDir={this.props.selectedModelDir}
            selectedModelFile={this.props.selectedModelFile} /> */}
        </div>
      );
    }
  };

  const ModelSelect = class ModelSelect extends React.Component {
    state = {}

    render() {
      let entries = this.getModelEntries();
      let options = entries.map(entry => {
        return (
          <option value={entry} key={entry}>{entry}</option>
        );
      });
      return (
        <div className="modelSelectContainer">
          Model:
          <select value={this.props.selectedModel} onChange={this.modelSelected}>
            {options}
          </select>
        </div>
      );
    }

    modelSelected = (e) => {
      if (this.props.onModelSelected)
        this.props.onModelSelected(e.target.value);
    }

    getModelEntries() {
      let entries = [];
      let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
      for (let d = 0; d < mainfsDirCount; d++) {
        let dirFileCount = PP64.fs.mainfs.getFileCount(d);
        for (let f = 0; f < dirFileCount; f++) {
          let file = PP64.fs.mainfs.get(d, f);
          if (PP64.utils.FORM.isForm(file)) {
            let name = d + "/" + f;
            try {
              // let form = PP64.utils.FORM.unpack(file);
              // if (form.STRG && form.STRG[0] && form.STRG[0].parsed)
              //   name += ` (${form.STRG[0].parsed[0]})`;
              entries.push(name);
            }
            catch (e) {
              console.error(`Could not parse FORM ${d}/${f}`, e);
            }
          }
        }
      }
      return entries;
    }
  };

  const ModelBGColorSelect = class ModelBGColorSelect extends React.Component {
    state = {}

    render() {
      const ToggleButton = PP64.controls.ToggleButton;
      return (
        <div className="modelViewerColorPicker">
          <ToggleButton id={0x000000} key={0} allowDeselect={false} onToggled={this.onColorChange}
            pressed={this.props.selectedColor === 0x000000}>
            <span className="colorSwatch" title="Change background to black"
              style={{backgroundColor: "#000000"}}></span>
          </ToggleButton>
          <ToggleButton id={0xFFFFFF} key={1} allowDeselect={false} onToggled={this.onColorChange}
            pressed={this.props.selectedColor === 0xFFFFFF}>
            <span className="colorSwatch" title="Change background to white"
              style={{backgroundColor: "#FFFFFF"}}></span>
          </ToggleButton>
        </div>
      );
    }

    onColorChange = (id, pressed) => {
      this.setState({ color: id });
      this.props.onColorChange(id);
    }
  };

  const ModelExportObjButton = class ModelExportObjButton extends React.Component {
    state = {}

    render() {
      const Button = PP64.controls.Button;
      return (
        <Button onClick={this.export} css="nbCreate">Export OBJ</Button>
      );
    }

    export = () => {
      const [dir, file] = [this.props.selectedModelDir, this.props.selectedModelFile];

      const form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      const converter = new FormToThreeJs();
      converter.separateGeometries = false;

      // const meshes = converter.createMeshes(form);
      // THREEToOBJ.fromMesh(meshes[0]).then(blob => {
      //   saveAs(blob, `model-${dir}-${file}.obj`);
      // })
    }
  };

  class FormToThreeJs {
    constructor() {
      this.separateGeometries = true;
    }

    createModel(form) {
      const materials = this._parseMaterials(form);
      return this._parseForm(form, materials);
    }

    _parseForm(form, materials) {
      const childObjs = this._parseFormObj(form, materials, 0);
      if (childObjs.length !== 1)
        console.warn(`Expected 1 return object from _parseForm, got ${childObjs.length}`);
      return childObjs[0];
    }

    _parseFormObj(form, materials, objIndex) {
      let objs = PP64.utils.FORM.getByGlobalIndex(form, "OBJ1", objIndex);
      if (objs === null) {
        if (objIndex === 0) { // mp2 62/2 doesn't have 0 obj?
          objs = form.OBJ1[0].parsed.objects[0];
          console.warn("Using first object rather than global index 0 object");
        }

        if (!objs)
          throw `Attempted to get unavailable OBJ ${objIndex}`;
      }

      if (!Array.isArray(objs)) {
        objs = [objs];
      }

      const newObjs = [];

      for (let o = 0; o < objs.length; o++) {
        const obj = objs[o];

        if (obj.objType === 0x3D) { // Just references other objects, can transform them.
          const newObj = this._createObject3DFromOBJ1Entry(obj);

          for (let i = 0; i < obj.children.length; i++) {
            const childObjs = this._parseFormObj(form, materials, obj.children[i]);
            if (childObjs && childObjs.length) {
              childObjs.forEach(childObj => {
                newObj.add(childObj);
              });
            }
          }

          newObjs.push(newObj);
        }
        else if (obj.objType === 0x10) { // References a SKL1, which will point back to other objects.
          const newObj = this._createObject3DFromOBJ1Entry(obj);

          const skl1GlobalIndex = obj.skeletonGlobalIndex;
          const sklMatch = PP64.utils.FORM.getByGlobalIndex(form, "SKL1", skl1GlobalIndex);
          if (sklMatch === null || Array.isArray(sklMatch))
            throw "Unexpected SKL1 search result";

          const skls = sklMatch.skls;
          for (let s = 0; s < skls.length; s++) {
            const sklObj = this._createObject3DFromOBJ1Entry(skls[s]);

            const nextObjIndex = skls[s].objGlobalIndex;

            const childObjs = this._parseFormObj(form, materials, nextObjIndex);
            if (childObjs && childObjs.length) {
              childObjs.forEach(childObj => {
                sklObj.add(childObj);
              });
              newObj.add(sklObj);
            }
          }

          newObjs.push(newObj);
        }
        else if (obj.objType === 0x3A) {
          const newObj = this._createObject3DFromOBJ1Entry(obj);

          const geometry = new THREE.Geometry();

          for (let f = obj.faceIndex; f < obj.faceIndex + obj.faceCount; f++) {
            const face = form.FAC1[0].parsed.faces[f];
            this._populateGeometryWithFace(form, geometry, face);
          }

          newObj.add(new THREE.Mesh(geometry, materials));

          newObjs.push(newObj);
        }
      }

      return newObjs;
    }

    _createObject3DFromOBJ1Entry(obj) {
      const newObj = new THREE.Object3D();

      newObj.position.x = obj.posX;
      newObj.position.y = obj.posY;
      newObj.position.z = obj.posZ;

      newObj.rotation.x = $$number.degreesToRadians(obj.rotX);
      newObj.rotation.y = $$number.degreesToRadians(obj.rotY);
      newObj.rotation.z = $$number.degreesToRadians(obj.rotZ);
      newObj.rotation.order = "ZYX";

      newObj.scale.x = obj.scaleX;
      newObj.scale.y = obj.scaleY;
      newObj.scale.z = obj.scaleZ;

      return newObj;
    }

    _populateGeometryWithFace(form, geometry, face) {
      if (!face.vtxEntries.length)
        return;

      const scale = form.VTX1[0].parsed.scale;

      const vtxEntries = face.vtxEntries;
      let vtxIndices = [];
      for (let i = 0; i < 3; i++) {
        const vtxEntry = vtxEntries[i];
        let vtx = form.VTX1[0].parsed.vertices[vtxEntry.vertexIndex];
        vtxIndices.push(geometry.vertices.length);
        geometry.vertices.push(this._makeVertex(vtx, scale));
      }
      if (vtxEntries.length === 4) {
        for (let i = 0; i < 4; i++) {
          if (i === 1) continue; // 0, 2, 3
          const vtxEntry = vtxEntries[i];
          let vtx = form.VTX1[0].parsed.vertices[vtxEntry.vertexIndex];
          vtxIndices.push(geometry.vertices.length);
          geometry.vertices.push(this._makeVertex(vtx, scale));
        }
      }

      if (vtxEntries.length === 3) {
        this._addFace(geometry, form, face,
          [vtxIndices[0], vtxIndices[1], vtxIndices[2]],
          [vtxEntries[0], vtxEntries[1], vtxEntries[2]]
        );
      }
      else if (vtxEntries.length === 4) {
        this._addFace(geometry, form, face,
          [vtxIndices[0], vtxIndices[1], vtxIndices[2]],
          [vtxEntries[0], vtxEntries[1], vtxEntries[2]]
        );

        this._addFace(geometry, form, face,
          [vtxIndices[3], vtxIndices[4], vtxIndices[5]],
          [vtxEntries[0], vtxEntries[2], vtxEntries[3]]
        );
      }
    }

    _addFace(geometry, form, face, indices, vtxEntries) {
      const tri = new THREE.Face3();
      tri.a = indices[0];
      tri.b = indices[1];
      tri.c = indices[2];
      tri.vertexNormals = this._makeVertexNormals(form, vtxEntries[0].vertexIndex, vtxEntries[1].vertexIndex, vtxEntries[2].vertexIndex);
      tri.materialIndex = this._getMaterialIndex(face);
      tri.color = new THREE.Color(this._getColorBytes(form, face));
      tri.vertexColors = this._makeVertexColors(form, face, vtxEntries[0], vtxEntries[1], vtxEntries[2]);

      geometry.faceVertexUvs[0].push(this._makeVertexUVs(vtxEntries[0], vtxEntries[1], vtxEntries[2]));
      geometry.faces.push(tri);
    }

    _parseMaterials(form) {
      const materials = [
        new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors }),
        new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors }),
      ];

      if (form.BMP1) {
        if (form.ATR1 && form.ATR1[0]) {
          const atrs = form.ATR1[0].parsed.atrs;
          for (let i = 0; i < atrs.length; i++) {
            const atr = atrs[i];
            const bmp = PP64.utils.FORM.getByGlobalIndex(form, "BMP1", atr.bmpGlobalIndex);
            if (bmp === null || Array.isArray(bmp)) {
              console.warn("Unexpected bitmap result from global index lookup");
              continue;
            }

            const textureMaterial = this._createTextureMaterial(atr, bmp);
            materials.push(textureMaterial);
          }
        }
        else {
          console.warn("BMPs, but no ATRs");
        }
      }

      return materials;
    }

    _createTextureMaterial(atr, bmp) {
      const dataUri = PP64.utils.arrays.arrayBufferToDataURL(bmp.src, bmp.width, bmp.height);
      $$log("Texture", dataUri);
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = "";
      const texture = loader.load(dataUri);
      texture.flipY = false;
      texture.wrapS = this._getWrappingBehavior(atr.xBehavior);
      texture.wrapT = this._getWrappingBehavior(atr.yBehavior);

      return new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
    }

    _getWrappingBehavior(behavior) {
      switch (behavior) {
        case 0x2C:
          return THREE.MirroredRepeatWrapping;
        case 0x2D:
          return THREE.RepeatWrapping;
        case 0x2E:
          return THREE.ClampToEdgeWrapping; // default
        default:
          console.warn(`Unknown behavior ${$$hex(behavior)}`);
          return THREE.ClampToEdgeWrapping; // default
      }
    }

    _makeVertex(vtx, scale) {
      return new THREE.Vector3(
        (vtx.x * scale),
        (vtx.y * scale),
        (vtx.z * scale)
      );
    }

    _makeVertexNormals(form, vtxIndex1, vtxIndex2, vtxIndex3) {
      return [
        this._makeVertexNormal(form, vtxIndex1),
        this._makeVertexNormal(form, vtxIndex2),
        this._makeVertexNormal(form, vtxIndex3),
      ];
    }

    _makeVertexNormal(form, vtxIndex) {
      let vtx = form.VTX1[0].parsed.vertices[vtxIndex];
      return new THREE.Vector3(
        (vtx.normalX) / (127 + (vtx.normalX < 0 ? 1 : 0)),
        (vtx.normalY) / (127 + (vtx.normalY < 0 ? 1 : 0)),
        (vtx.normalZ) / (127 + (vtx.normalZ < 0 ? 1 : 0)),
      );
    }

    _makeVertexUVs(vtxEntry1, vtxEntry2, vtxEntry3) {
      return [
        this._makeVertexUV(vtxEntry1),
        this._makeVertexUV(vtxEntry2),
        this._makeVertexUV(vtxEntry3),
      ];
    }

    _makeVertexUV(vtxEntry) {
      return new THREE.Vector2(vtxEntry.u, vtxEntry.v);
    }

    _getMaterialIndex(face) {
      if (face.atrIndex >= 0 || face.mystery3 === 0x36) { // Face colors, or maybe bitmap
        // If it is 0xFFFF (-1) -> THREE.FaceColors material
        // If greater, it'll be a bitmap material
        return face.atrIndex + 2;
      }
      else if (face.mystery3 === 0x37) { // Vertex colors?
        return 0; // Vertex colors
      }
    }

    _getColorBytes(form, face) {
      if (face.mystery3 === 0x36) {
        const materialIndex = face.materialIndex;
        return this._getColorFromMaterial(form, materialIndex);
      }
      else if (face.mystery3 === 0x37) { // Vertex colors?
        return 0xFFFC00; // Puke green, shouldn't see this
      }

      console.warn("Could not determine color for face");
    }

    _getColorFromMaterial(form, materialIndex) {
      if (form.MAT1 && form.MAT1[0] && form.MAT1[0].parsed) {
        const colorIndex = form.MAT1[0].parsed.materials[materialIndex].colorIndex;
        if (form.COL1 && form.COL1[0] && form.COL1[0].parsed) {
          if (form.COL1[0].parsed.hasOwnProperty(colorIndex))
            return form.COL1[0].parsed[colorIndex] >>> 8;
        }
      }

      console.warn(`Could not find color ${colorIndex} specified by material ${materialIndex}`);
      return 0xFFFC00; // Puke green
    }

    _makeVertexColors(form, face, vtxEntry1, vtxEntry2, vtxEntry3) {
      if (face.mystery3 !== 0x37)
        return [];

      return [
        this._makeVertexColor(form, vtxEntry1),
        this._makeVertexColor(form, vtxEntry2),
        this._makeVertexColor(form, vtxEntry3),
      ];
    }

    _makeVertexColor(form, vtxEntry) {
      if (vtxEntry.materialIndex < 0)
        return null;
      return new THREE.Color(this._getColorFromMaterial(form, vtxEntry.materialIndex));
    }
  };

  return {
    ModelViewer,
  };
})();
