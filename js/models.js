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

      let pieces = this.props.selectedModel.split("/");
      let [dir, file] = pieces;

      let container = ReactDOM.findDOMNode(this);

      let height = window.innerHeight - 48 - 40; // - headerHeight
      let width = window.innerWidth - 2;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 20000);
      camera.position.z = 500;

      let geometries = [];

      $$log(`Rendering model ${dir}/${file}`);
      let form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      this.populateGeometry(geometries, form);

      $$log("Displaying geometries", geometries);

      geometries.forEach((geometry) => {
        let dotMaterial = new THREE.PointsMaterial({ size: 3, sizeAttenuation: true });
        let dots = new THREE.Points(geometry, dotMaterial);
        scene.add(dots);

        //let wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: false, color: 0xFFAA00 });
        let wireframeMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
        //let wireframe = new THREE.Mesh(geometry, wireframeMaterial);
        let wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), wireframeMaterial);
        scene.add(wireframe);
      });

      renderer = new THREE.WebGLRenderer();
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
      else if (obj.objType === 0x3A) {
        let geometry = new THREE.Geometry();
        geometries.push(geometry);

        let vtxBase;
        for (let i = obj.faceIndex; i < obj.faceIndex + obj.faceCount; i++) {
          let face = form.FAC1[0].parsed.faces[i];

          if (vtxBase === undefined) {
            vtxBase = face.vtxEntries[0].vertexIndex;
          }

          const newCoords = {
            x: coords.x,
            y: coords.y,
            z: coords.z,
          };

          this.populateGeometryWithFace(geometry, form, face, vtxBase, newCoords);
        }
      }
    }

    populateGeometryWithFace(geometry, form, face, vtxBase, coords) {
      const scale = form.VTX1[0].parsed.scale;

      for (let i = 0; i < face.vtxEntries.length; i++) {
        const vtxEntry = face.vtxEntries[i];
        let vtx = form.VTX1[0].parsed.vertices[vtxEntry.vertexIndex];
        geometry.vertices.push(new THREE.Vector3(
          coords.x + (vtx.x * scale),
          coords.y + (vtx.y * scale),
          coords.z + (vtx.z * scale)
        ));
      }

      if (face.vtxEntries.length === 3) {
        const tri = new THREE.Face3();
        tri.a = face.vtxEntries[0].vertexIndex - vtxBase;
        tri.b = face.vtxEntries[1].vertexIndex - vtxBase;
        tri.c = face.vtxEntries[2].vertexIndex - vtxBase;
        tri.color = new THREE.Color(0xaa9900);
        geometry.faces.push(tri);
      }
      else if (face.vtxEntries.length === 4) {
        const tri1 = new THREE.Face3();
        tri1.a = face.vtxEntries[0].vertexIndex - vtxBase;
        tri1.b = face.vtxEntries[1].vertexIndex - vtxBase;
        tri1.c = face.vtxEntries[2].vertexIndex - vtxBase;
        tri1.color = new THREE.Color(0xaa9900);
        geometry.faces.push(tri1);

        const tri2 = new THREE.Face3();
        tri2.a = face.vtxEntries[0].vertexIndex - vtxBase;
        tri2.b = face.vtxEntries[3].vertexIndex - vtxBase;
        tri2.c = face.vtxEntries[2].vertexIndex - vtxBase;
        tri2.color = new THREE.Color(0xaa9900);
        geometry.faces.push(tri2);
      }
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
          if (PP64.utils.FORM.isForm(file))
            entries.push(d + "/" + f);
        }
      }
      return entries;
    }
  };

  return {
    ModelViewer,
  };
})();
