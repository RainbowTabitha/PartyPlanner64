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
      camera.position.z = 1000;

      let dotGeometry = new THREE.Geometry();

      let form = PP64.utils.FORM.unpack(PP64.adapters.mainfs.get(dir, file));
      for (let i = 0; i < form.VTX1[0].parsed.vertices.length; i++) {
        let vtx = form.VTX1[0].parsed.vertices[i];
        dotGeometry.vertices.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      }

      let dotMaterial = new THREE.PointsMaterial({ size:  45, sizeAttenuation: true });
      let dot = new THREE.Points(dotGeometry, dotMaterial);
      scene.add(dot);

      renderer = new THREE.WebGLRenderer();
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
      let mainfsDirCount = PP64.adapters.mainfs.getDirectoryCount();
      for (let d = 0; d < mainfsDirCount; d++) {
        let dirFileCount = PP64.adapters.mainfs.getFileCount(d);
        for (let f = 0; f < dirFileCount; f++) {
          let file = PP64.adapters.mainfs.get(d, f);
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
