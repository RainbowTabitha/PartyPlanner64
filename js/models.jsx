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

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 20000);
      camera.position.z = 500;

      $$log(`Rendering model ${dir}/${file}`);

      const form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      const meshes = (new FormToThreeJs()).createMeshes(form);
      meshes.forEach(mesh => {
        scene.add(mesh);
      });

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
          <div className="modelViewerToolbarSpacer" />
          <ModelExportObjButton
            selectedModelDir={this.props.selectedModelDir}
            selectedModelFile={this.props.selectedModelFile} />
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

      const meshes = converter.createMeshes(form);
      THREEToOBJ.fromMesh(meshes[0]).then(blob => {
        saveAs(blob, `model-${dir}-${file}.obj`);
      })
    }
  };

  class FormToThreeJs {
    constructor() {
      this.separateGeometries = true;
    }

    createMeshes(form) {
      let geometries = [];

      $$log("Form ", form);

      this.populateGeometry(geometries, form);

      $$log("Displaying geometries", geometries);

      let materials = [];
      if (form.BMP1) {
        const sortedBMPs = form.BMP1.slice().sort((a, b) => {
          if (!a.parsed || !b.parsed)
            return 0; // Eh?

          if (a.parsed.globalIndex < b.parsed.globalIndex)
            return -1;
          if (a.parsed.globalIndex > b.parsed.globalIndex)
            return 1;
          throw "sorting BMPs: global indices cannot be equal";
        });

        const atrsByBitmap = {};
        if (form.ATR1 && form.ATR1[0]) {
          const atrs = form.ATR1[0].parsed.atrs;
          for (let i = 0; i < atrs.length; i++) {
            // TODO: Why are there sometimes duplicate atrs? ex mp3 49/3
            // Going with the first one for now.
            if (!atrsByBitmap[atrs[i].bmpGlobalIndex])
              atrsByBitmap[atrs[i].bmpGlobalIndex] = atrs[i];
          }
        }

        for (let i = 0; i < sortedBMPs.length; i++) {
          if (sortedBMPs[i] && sortedBMPs[i].parsed) {
            const bmp = sortedBMPs[i].parsed;
            const dataUri = PP64.utils.arrays.arrayBufferToDataURL(bmp.src, bmp.width, bmp.height);
            $$log("Texture", dataUri);
            const loader = new THREE.TextureLoader();
            loader.crossOrigin = "";
            const texture = loader.load(dataUri);
            texture.flipY = false;

            const atr = atrsByBitmap[bmp.globalIndex];
            if (atr) {
              switch (atr.xBehavior) {
                case 0x2C:
                  texture.wrapS = THREE.MirroredRepeatWrapping;
                  break;
                case 0x2D:
                  texture.wrapS = THREE.RepeatWrapping;
                  break;
                case 0x2E:
                  break; // THREE.ClampToEdgeWrapping, default
                default:
                  console.warn(`Unknown xBehavior ${$$hex(atr.xBehavior)} in BMP ${i}`);
                  break;
              }

              switch (atr.yBehavior) {
                case 0x2C:
                  texture.wrapT = THREE.MirroredRepeatWrapping;
                  break;
                case 0x2D:
                  texture.wrapT = THREE.RepeatWrapping;
                  break;
                case 0x2E:
                  break; // THREE.ClampToEdgeWrapping, default
                default:
                  console.warn(`Unknown yBehavior ${$$hex(atr.yBehavior)} in BMP ${i}`);
                  break;
              }
            }

            const textureMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
            materials.push(textureMaterial);
          }
        }
      }
      if (!materials.length)
        materials = [new THREE.MeshBasicMaterial()];

      materials[-1] = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });

      $$log(materials);

      var meshes = []

      geometries.forEach((geometry) => {
        // let dotMaterial = new THREE.PointsMaterial({ size: 3, sizeAttenuation: true });
        // let dots = new THREE.Points(geometry, dotMaterial);
        // scene.add(dots);

        meshes.push(new THREE.Mesh(geometry, materials));
        //scene.add(mesh);
        //$$log(mesh);

        // let wireframeMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
        // let wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), wireframeMaterial);
        // scene.add(wireframe);

        // var normalsHelper = new THREE.VertexNormalsHelper(mesh, 8, 0x00ff00, 1);
        // scene.add(normalsHelper);

        //geometry.computeFaceNormals();
      });

      return meshes;
    }

    populateGeometry(geometries, form) {
      this.populateGeometryWithObject(geometries, form, 0, { x: 0, y: 0, z: 0 });
    }

    populateGeometryWithObject(geometries, form, objIndex, coords) {
      var obj = form.OBJ1[0].parsed.objects[objIndex];
      if (obj.objType === 0x3D) {
        // Recurse to child objs

        const newCoords = {
          x: coords.x + obj.mystery1,
          y: coords.y + obj.mystery2,
          z: coords.z + obj.mystery3,
        };

        for (let i = 0; i < obj.children.length; i++) {
          this.populateGeometryWithObject(geometries, form, obj.children[i], newCoords);
        }
      }
      if (obj.objType === 0x10) {
        // Look into SKL1, which should point back to an OBJ1 entry.

        const newCoords = { // TODO: there are probably floats to include here
          x: coords.x,
          y: coords.y,
          z: coords.z,
        };

        const skl1GlobalIndex = obj.skeletonGlobalIndex;
        for (let i = 0; i < form.SKL1.length; i++) {
          if (form.SKL1[i].parsed.globalIndex === skl1GlobalIndex) {
            const nextObjIndex = form.SKL1[i].parsed.objIndex;
            this.populateGeometryWithObject(geometries, form, nextObjIndex, newCoords);
            break;
          }
        }
      }
      else if (obj.objType === 0x3A) {
        let geometry;
        if (this.separateGeometries || !geometries.length) {
          geometry = new THREE.Geometry();
          geometries.push(geometry);
        }
        else {
          geometry = geometries[0];
        }

        for (let i = obj.faceIndex; i < obj.faceIndex + obj.faceCount; i++) {
          let face = form.FAC1[0].parsed.faces[i];

          const newCoords = {
            x: coords.x,
            y: coords.y,
            z: coords.z,
          };

          this.populateGeometryWithFace(geometry, form, face, newCoords);
        }
      }
    }

    populateGeometryWithFace(geometry, form, face, coords) {
      if (!face.vtxEntries.length)
        return;

      const scale = form.VTX1[0].parsed.scale;

      const vtxEntries = face.vtxEntries;
      let vtxIndices = [];
      for (let i = 0; i < 3; i++) {
        const vtxEntry = vtxEntries[i];
        let vtx = form.VTX1[0].parsed.vertices[vtxEntry.vertexIndex];
        vtxIndices.push(geometry.vertices.length);
        geometry.vertices.push(this.makeVertex(vtx, coords, scale));
      }
      if (vtxEntries.length === 4) {
        for (let i = 0; i < 4; i++) {
          if (i === 1) continue; // 0, 2, 3
          const vtxEntry = vtxEntries[i];
          let vtx = form.VTX1[0].parsed.vertices[vtxEntry.vertexIndex];
          vtxIndices.push(geometry.vertices.length);
          geometry.vertices.push(this.makeVertex(vtx, coords, scale));
        }
      }

      if (vtxEntries.length === 3) {
        const tri = new THREE.Face3();
        tri.a = vtxIndices[0];
        tri.b = vtxIndices[1];
        tri.c = vtxIndices[2];
        tri.vertexNormals = this.makeVertexNormals(form, vtxEntries[0].vertexIndex, vtxEntries[1].vertexIndex, vtxEntries[2].vertexIndex);
        tri.materialIndex = face.mystery2;
        tri.color = new THREE.Color(this.getColorBytes(form, face.mystery1));

        geometry.faceVertexUvs[0].push(this.makeVertexUVs(vtxEntries[0], vtxEntries[1], vtxEntries[2]));
        geometry.faces.push(tri);
      }
      else if (vtxEntries.length === 4) {
        const tri1 = new THREE.Face3();
        tri1.a = vtxIndices[0];
        tri1.b = vtxIndices[1];
        tri1.c = vtxIndices[2];
        tri1.vertexNormals = this.makeVertexNormals(form, vtxEntries[0].vertexIndex, vtxEntries[1].vertexIndex, vtxEntries[2].vertexIndex);
        tri1.materialIndex = face.mystery2;
        tri1.color = new THREE.Color(this.getColorBytes(form, face.mystery1));

        geometry.faceVertexUvs[0].push(this.makeVertexUVs(vtxEntries[0], vtxEntries[1], vtxEntries[2]));
        geometry.faces.push(tri1);

        const tri2 = new THREE.Face3();
        tri2.a = vtxIndices[3];
        tri2.b = vtxIndices[4];
        tri2.c = vtxIndices[5];
        tri2.vertexNormals = this.makeVertexNormals(form, vtxEntries[0].vertexIndex, vtxEntries[2].vertexIndex, vtxEntries[3].vertexIndex);
        tri2.materialIndex = face.mystery2;
        tri2.color = new THREE.Color(this.getColorBytes(form, face.mystery1));

        geometry.faceVertexUvs[0].push(this.makeVertexUVs(vtxEntries[0], vtxEntries[2], vtxEntries[3]));
        geometry.faces.push(tri2);
      }
    }

    makeVertex(vtx, baseCoords, scale) {
      return new THREE.Vector3(
        baseCoords.x + (vtx.x * scale),
        baseCoords.y + (vtx.y * scale),
        baseCoords.z + (vtx.z * scale)
      )
    }

    makeVertexNormals(form, vtxIndex1, vtxIndex2, vtxIndex3) {
      return [
        this.makeVertexNormal(form, vtxIndex1),
        this.makeVertexNormal(form, vtxIndex2),
        this.makeVertexNormal(form, vtxIndex3),
      ];
    }

    makeVertexNormal(form, vtxIndex) {
      let vtx = form.VTX1[0].parsed.vertices[vtxIndex];
      return new THREE.Vector3(
        (vtx.normalX) / (127 + (vtx.normalX < 0 ? 1 : 0)),
        (vtx.normalY) / (127 + (vtx.normalY < 0 ? 1 : 0)),
        (vtx.normalZ) / (127 + (vtx.normalZ < 0 ? 1 : 0)),
      );
    }

    makeVertexUVs(vtxEntry1, vtxEntry2, vtxEntry3) {
      return [
        this.makeVertexUV(vtxEntry1),
        this.makeVertexUV(vtxEntry2),
        this.makeVertexUV(vtxEntry3),
      ];
    }

    makeVertexUV(vtxEntry) {
      return new THREE.Vector2(vtxEntry.mystery2, vtxEntry.mystery3);
    }

    getColorBytes(form, index) {
      if (form.MAT1 && form.MAT1[0] && form.MAT1[0].parsed) {
        const colorIndex = form.MAT1[0].parsed.materials[index].colorIndex;
        if (form.COL1 && form.COL1[0] && form.COL1[0].parsed)
          return form.COL1[0].parsed[colorIndex] >>> 8;
      }
      //   return form.COL1[0].parsed[index] >>> 8;
      // if (form.COL1 && form.COL1[0] && form.COL1[0].parsed)
      //   return form.COL1[0].parsed[index] >>> 8;
      console.warn("Tried to get COL1 entry, but no COL1 was parsed");
    }
  };

  return {
    ModelViewer,
  };
})();
