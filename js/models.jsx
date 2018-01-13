PP64.models = (function() {
  const ModelViewer = class ModelViewer extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        selectedModel: "",
        selectedModelDir: null,
        selectedModelFile: null,
        selectedAnim: "",
        selectedAnimDir: null,
        selectedAnimFile: null,
        bgColor: 0x000000,
        showTextures: true,
        showWireframe: false,
        showVertexNormals: false,
        useCamera: false,
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
            selectedAnim={this.state.selectedAnim}
            onAnimSelected={this.onAnimSelected}
            selectedAnimDir={this.state.selectedAnimDir}
            selectedAnimFile={this.state.selectedAnimFile}
            bgColor={this.state.bgColor}
            onBgColorChange={this.onBgColorChange}
            showTextures={this.state.showTextures}
            showWireframe={this.state.showWireframe}
            showVertexNormals={this.state.showVertexNormals}
            useCamera={this.state.useCamera}
            onFeatureChange={this.onFeatureChange} />
          <ModelRenderer
            selectedModelDir={this.state.selectedModelDir}
            selectedModelFile={this.state.selectedModelFile}
            selectedAnimDir={this.state.selectedAnimDir}
            selectedAnimFile={this.state.selectedAnimFile}
            bgColor={this.state.bgColor}
            showTextures={this.state.showTextures}
            showWireframe={this.state.showWireframe}
            showVertexNormals={this.state.showVertexNormals}
            useCamera={this.state.useCamera} />
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

        // Clear the animation
        selectedAnim: "",
        selectedAnimDir: null,
        selectedAnimFile: null,
      });
    }

    onAnimSelected = (anim) => {
      if (!anim) {
        this.setState({
          selectedAnim: "",
          selectedAnimDir: null,
          selectedAnimFile: null,
        });
        return;
      }

      const pieces = anim.match(/^(\d+)\/(\d+)/);
      if (!pieces) {
        throw `Error parsing anim string ${anim}`;
      }

      const [, dir, file] = pieces;

      this.setState({
        selectedAnim: anim,
        selectedAnimDir: dir,
        selectedAnimFile: file,
      });
    }

    onBgColorChange = (color) => {
      this.setState({
        bgColor: color,
      });
    }

    onFeatureChange = (features) => {
      this.setState(features);
    }
  };

  let _modelRenderer;
  let camera, scene, renderer, controls, clock, mixer;
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
      this.disposeTHREERenderer();
      this.disposeTHREEObj(scene);
      scene = null;
      if (mixer) {
        mixer.stopAllAction();
        mixer = null;
      }
      if (clock) {
        clock.stop();
        clock = null;
      }
    }

    disposeTHREERenderer() {
      if (!renderer)
        return;

      renderer.dispose();
      renderer.forceContextLoss();

      let container = ReactDOM.findDOMNode(this);
      if (renderer.domElement.offsetParent)
        container.removeChild(renderer.domElement);

      renderer.context = undefined;
      renderer.domElement = undefined;
      renderer = null;
    }

    disposeTHREEObj(obj) {
      if (!obj) {
        return;
      }

      for (let i = 0; i < obj.children.length; i++) {
        this.disposeTHREEObj(obj.children[i]);
      }

      if (obj.geometry) {
        obj.geometry.dispose();
        obj.geometry = undefined;
      }
      if (obj.material) {
        let materialArray;
        if (obj.material instanceof THREE.MeshFaceMaterial || obj.material instanceof THREE.MultiMaterial) {
          materialArray = obj.material.materials;
        }
        else if (obj.material instanceof Array) {
          materialArray = obj.material;
        }
        if (materialArray) {
          materialArray.forEach(function (mtrl, idx) {
            if (mtrl.map) mtrl.map.dispose();
            if (mtrl.lightMap) mtrl.lightMap.dispose();
            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
            if (mtrl.normalMap) mtrl.normalMap.dispose();
            if (mtrl.specularMap) mtrl.specularMap.dispose();
            if (mtrl.envMap) mtrl.envMap.dispose();
            mtrl.dispose();
          });
        }
        else {
          if (obj.material.map) obj.material.map.dispose();
          if (obj.material.lightMap) obj.material.lightMap.dispose();
          if (obj.material.bumpMap) obj.material.bumpMap.dispose();
          if (obj.material.normalMap) obj.material.normalMap.dispose();
          if (obj.material.specularMap) obj.material.specularMap.dispose();
          if (obj.material.envMap) obj.material.envMap.dispose();
          obj.material.dispose();
        }
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

      $$log(`Rendering model ${dir}/${file}`);

      const form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      $$log("form", form);

      const converter = new PP64.utils.FormToThreeJs();
      converter.bgColor = this.props.bgColor;
      converter.showTextures = this.props.showTextures;
      converter.showWireframe = this.props.showWireframe;
      converter.showVertexNormals = this.props.showVertexNormals;
      converter.useFormCamera = this.props.useCamera;

      const modelObj = converter.createModel(form);
      scene.add(modelObj);

      if (this.props.showVertexNormals) {
        const normalsHelper = new THREE.VertexNormalsHelper(modelObj, 8, 0x00FF00, 1);
        scene.add(normalsHelper);
      }

      $$log("Scene", scene);

      if (this.props.selectedAnimDir !== null) {
        const [dir, file] = [this.props.selectedAnimDir, this.props.selectedAnimFile];
        const mtnx = PP64.utils.MTNX.unpack(PP64.fs.mainfs.get(dir, file));
        $$log("mtnx", mtnx);

        const animConverter = new PP64.utils.MtnxToThreeJs();
        const clip = animConverter.createClip(mtnx);
        $$log("mtnxClip", clip);

        mixer = new THREE.AnimationMixer(scene);
        const mtnxClipAction = mixer.clipAction(clip);
        mtnxClipAction.play();

        clock = new THREE.Clock();
      }

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);

      container.appendChild(renderer.domElement);

      camera = converter.createCamera(form, width, height);

      controls = new THREE.OrbitControls(camera, renderer.domElement);

      this.animate();
    }

    renderModel() {
      renderer.render(scene, camera);
    }

    animate() {
      if (!_modelRenderer || !renderer)
        return;

      controls.update();

      if (clock) {
        const delta = clock.getDelta();
        if (mixer) {
          mixer.update(delta);
        }
      }

      _modelRenderer.renderModel();
      requestAnimationFrame(_modelRenderer.animate);
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
          <AnimSelect
            selectedAnim={this.props.selectedAnim}
            onAnimSelected={this.props.onAnimSelected} />
          <ModelBGColorSelect
            selectedColor={this.props.bgColor}
            onColorChange={this.props.onBgColorChange} />
          <ModelFeatureSelect
            showTextures={this.props.showTextures}
            showWireframe={this.props.showWireframe}
            showVertexNormals={this.props.showVertexNormals}
            useCamera={this.props.useCamera}
            onFeatureChange={this.props.onFeatureChange} />
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

  const AnimSelect = class AnimSelect extends React.Component {
    state = {}

    render() {
      let entries = this.getAnimEntries();
      let options = entries.map(entry => {
        return (
          <option value={entry} key={entry}>{entry}</option>
        );
      });
      options.unshift((
          <option value={""} key={""}></option>
      ));
      return (
        <div className="modelSelectContainer">
          Animation:
          <select value={this.props.selectedAnim} onChange={this.animSelected}>
            {options}
          </select>
        </div>
      );
    }

    animSelected = (e) => {
      if (this.props.onAnimSelected)
        this.props.onAnimSelected(e.target.value);
    }

    getAnimEntries() {
      let entries = [];
      let mainfsDirCount = PP64.fs.mainfs.getDirectoryCount();
      for (let d = 0; d < mainfsDirCount; d++) {
        let dirFileCount = PP64.fs.mainfs.getFileCount(d);
        for (let f = 0; f < dirFileCount; f++) {
          let file = PP64.fs.mainfs.get(d, f);
          if (PP64.utils.MTNX.isMtnx(file)) {
            let name = d + "/" + f;
            try {
              // let form = PP64.utils.FORM.unpack(file);
              // if (form.STRG && form.STRG[0] && form.STRG[0].parsed)
              //   name += ` (${form.STRG[0].parsed[0]})`;
              entries.push(name);
            }
            catch (e) {
              console.error(`Could not parse MTNX ${d}/${f}`, e);
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

  const ModelFeatureSelect = class ModelFeatureSelect extends React.Component {
    state = {}

    render() {
      let advancedFeatures;
      if (PP64.settings.get($setting.uiAdvanced)) {
        advancedFeatures = [
          <label>
            <input type="checkbox" key="modelFeatureSelectShowVertexNormals"
              checked={this.props.showVertexNormals} onChange={this.onShowNormalsChange} />
            Vertex Normals
          </label>
        ];
      }
      return (
        <div className="modelFeatureSelectContainer">
          <label>
            <input type="checkbox" key="modelFeatureSelectShowTextures"
              checked={this.props.showTextures} onChange={this.onShowTextureChange} />
            Textures
          </label>
          <label>
            <input type="checkbox" key="modelFeatureSelectShowWireframe"
              checked={this.props.showWireframe} onChange={this.onShowWireframeChange} />
            Wireframe
          </label>
          <label title="Use the camera defined by the model">
            <input type="checkbox" key="modelFeatureSelectUseCamera"
              checked={this.props.useCamera} onChange={this.onUseCameraChange} />
            Camera
          </label>
          {advancedFeatures}
        </div>
      );
    }

    onShowTextureChange = (event) => {
      const pressed = event.target.checked;
      if (!pressed && !this.props.showWireframe) {
        this.props.onFeatureChange({
          showTextures: pressed,
          showWireframe: true,
        });
      }
      else {
        this.props.onFeatureChange({
          showTextures: pressed,
        });
      }
    }

    onShowWireframeChange = (event) => {
      const pressed = event.target.checked;
      if (!pressed && !this.props.showTextures) {
        this.props.onFeatureChange({
          showTextures: true,
          showWireframe: pressed,
        });
      }
      else {
        this.props.onFeatureChange({
          showWireframe: pressed,
        });
      }
    }

    onShowNormalsChange = (event) => {
      const pressed = event.target.checked;
      this.props.onFeatureChange({
        showVertexNormals: pressed,
      });
    }

    onUseCameraChange = (event) => {
      const pressed = event.target.checked;
      this.props.onFeatureChange({
        useCamera: pressed,
      });
    }
  };

  const ModelExportObjButton = class ModelExportObjButton extends React.Component {
    state = {}

    render() {
      const Button = PP64.controls.Button;
      return (
        <Button onClick={this.export} css="btnModelExport">
          <img src="img/model/export.png" height="16" width="16" />
          glTF
        </Button>
      );
    }

    export = () => {
      const [dir, file] = [this.props.selectedModelDir, this.props.selectedModelFile];

      const form = PP64.utils.FORM.unpack(PP64.fs.mainfs.get(dir, file));

      const converter = new PP64.utils.FormToThreeJs();

      const modelObj = converter.createModel(form);

      GLTFUtils.exportGLTF(GLTFUtils.glTFAssetFromTHREE(modelObj), {
        jsZip: JSZip,
      }).then(blob => {
        saveAs(blob, `model-${dir}-${file}.zip`);
      });

      // const meshes = converter.createMeshes(form);
      // THREEToOBJ.fromMesh(meshes[0]).then(blob => {
      //   saveAs(blob, `model-${dir}-${file}.obj`);
      // });
    }
  };

  return {
    ModelViewer,
  };
})();
