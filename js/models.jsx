PP64.models = (function() {
  const ModelViewer = class ModelViewer extends React.Component {
    state = {
      selectedModel: "",
    }

    render() {
      return (
        <div className="modelViewerContainer">
          <ModelToolbar selectedModel={this.state.selectedModel} onModelSelected={this.onModelSelected} />
          <ModelRenderer selectedModel={this.state.selectedModel} />
        </div>
      );
    }

    onModelSelected = (model) => {
      this.setState({selectedModel: model});
    }
  };

  let _modelRenderer, camera, scene, renderer, controls, animateTimer;
  const ModelRenderer = class ModelRenderer extends React.Component {
    state = {}

    render() {
      return (
        <div className="modelRenderContainer"></div>
      );
    }

    componentDidMount() {
      _modelRenderer = this;
      this.initModel();
    }

    componentWillUnmount() {
      _modelRenderer = null;
      this.clearViewer();
    }

    componentDidUpdate() {
      this.clearViewer();
      this.initModel();
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
      if (!this.props.selectedModel) {
        return;
      }

      let pieces = this.props.selectedModel.match(/^(\d+)\/(\d+)/);
      if (!pieces)
        throw `Could not parse selected model string ${this.props.selectedModel}`;

      let [, dir, file] = pieces;

      let container = ReactDOM.findDOMNode(this);

      let height = container.offsetHeight;
      let width = container.offsetWidth;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 20000);
      camera.position.z = 500;

      let geometries = [];

      let form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      $$log(`Rendering model ${dir}/${file}`, form);

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

        for (let i = 0; i < sortedBMPs.length; i++) {
          if (sortedBMPs[i] && sortedBMPs[i].parsed) {
            const dataUri = PP64.utils.arrays.arrayBufferToDataURL(sortedBMPs[i].parsed.src, sortedBMPs[i].parsed.width, sortedBMPs[i].parsed.height);
            $$log("Texture", dataUri)
            const loader = new THREE.TextureLoader()
            loader.crossOrigin="";
            const texture = loader.load(dataUri);
            texture.flipY = false;
            //texture.wrapS = THREE.RepeatWrapping;
            //texture.wrapT = THREE.RepeatWrapping;
            const textureMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5 });
            materials.push(textureMaterial);
          }
        }
      }
      if (!materials.length)
        materials = [new THREE.MeshBasicMaterial()];

      materials[-1] = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors });

      //$$log(materials);

      geometries.forEach((geometry) => {
        // let dotMaterial = new THREE.PointsMaterial({ size: 3, sizeAttenuation: true });
        // let dots = new THREE.Points(geometry, dotMaterial);
        // scene.add(dots);

        let mesh = new THREE.Mesh(geometry, materials);
        scene.add(mesh);
        //$$log(mesh);

        // let wireframeMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
        // let wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), wireframeMaterial);
        // scene.add(wireframe);

        // var normalsHelper = new THREE.VertexNormalsHelper(mesh, 8, 0x00ff00, 1);
        // scene.add(normalsHelper);

        //geometry.computeFaceNormals();
      });

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);

      container.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);

      this.animate();
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
        let geometry = new THREE.Geometry();
        geometries.push(geometry);

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
      $$log("Tried to get COL1 entry, but no COL1 was parsed");
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
          <ModelSelect selectedModel={this.props.selectedModel}
            onModelSelected={this.props.onModelSelected} />
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

  return {
    ModelViewer,
  };
})();
